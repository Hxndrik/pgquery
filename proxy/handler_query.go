package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type queryRequest struct {
	Connection string `json:"connection"`
	Query      string `json:"query"`
	Params     []any  `json:"params"`
	// Text returns every value as Postgres prints it (a string, or null),
	// so nothing is lost on the way to JavaScript: int8, numeric, NaN,
	// infinity, intervals, geometry, bytea … The app's result grids and table
	// editor use this. Without it, values are decoded into JSON types (the
	// catalog pages rely on real numbers, booleans and arrays).
	Text bool `json:"text"`
	// CellLimit cuts text values longer than this many bytes (0: no limit).
	// Cut cells are listed in the response's "cut".
	CellLimit int `json:"cellLimit"`
}

type columnInfo struct {
	Name string `json:"name"`
	Type string `json:"type"`
	// Category is pg_type.typcategory (N numeric, B boolean, D date/time,
	// S string, A array, U user-defined …). Only set in text mode.
	Category string `json:"category,omitempty"`
}

// cutCell marks a text value that was cut to the request's cellLimit.
type cutCell struct {
	Row  int `json:"row"`
	Col  int `json:"col"`
	Size int `json:"size"` // full size in bytes
}

type queryResponse struct {
	Columns   []columnInfo `json:"columns"`
	Rows      [][]any      `json:"rows"`
	RowCount  int          `json:"rowCount"`
	Duration  int64        `json:"duration"` // ms
	Truncated bool         `json:"truncated,omitempty"`
	Cut       []cutCell    `json:"cut,omitempty"`
}

type errorResponse struct {
	Error    string `json:"error"`
	Code     string `json:"code,omitempty"`
	Position int    `json:"position,omitempty"`
}

// maxResultBytes caps the text values held for one response, so a query over
// large values can't exhaust the proxy's memory. Rows past it are dropped and
// the result is marked truncated, like rows past MaxRows.
const maxResultBytes = 32 << 20

func (cfg *config) handleQuery(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req queryRequest
	dec := json.NewDecoder(r.Body)
	dec.UseNumber() // keep numeric params exact; see queryParams
	if err := dec.Decode(&req); err != nil {
		writeError(w, "invalid request body", "", 0, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Query) == "" {
		writeError(w, "query is required", "", 0, http.StatusBadRequest)
		return
	}

	// Connect with timeout
	connCtx, connCancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer connCancel()

	conn, err := cfg.connect(connCtx, req.Connection)
	if err != nil {
		writeError(w, connError(err), "", 0, http.StatusBadGateway)
		return
	}
	defer conn.Close(context.Background())

	// Execute with query timeout
	queryCtx, queryCancel := context.WithTimeout(r.Context(), cfg.QueryTimeout)
	defer queryCancel()

	resp, qErr := runQuery(queryCtx, conn, req, cfg.MaxRows)
	if qErr != nil {
		writeError(w, qErr.message, qErr.code, qErr.position, http.StatusOK)
		return
	}

	// Encode before writing anything, so an encoding failure becomes an error
	// response instead of an empty 200.
	body, err := json.Marshal(resp)
	if err != nil {
		writeError(w, "could not encode the result: "+err.Error(), "", 0, http.StatusOK)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
	w.Write([]byte("\n"))
}

// querier is what runQuery needs: a *pgx.Conn, or a pgx.Tx in tests.
type querier interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

// runQuery executes req.Query and collects the result.
func runQuery(ctx context.Context, conn querier, req queryRequest, maxRows int) (*queryResponse, *pgErrorInfo) {
	start := time.Now()

	args := queryParams(req.Params)
	if req.Text {
		// An empty by-OID map asks for text format (0) for every result column.
		args = append([]any{pgx.QueryResultFormatsByOID{}}, args...)
	}

	rows, err := conn.Query(ctx, req.Query, args...)
	if err != nil {
		e := extractPgError(err)
		return nil, &e
	}
	defer rows.Close()

	fieldDescs := rows.FieldDescriptions()
	resp := &queryResponse{Columns: make([]columnInfo, len(fieldDescs)), Rows: [][]any{}}
	for i, fd := range fieldDescs {
		resp.Columns[i] = columnInfo{Name: fd.Name, Type: pgTypeToString(fd.DataTypeOID)}
	}

	size := 0
	for rows.Next() {
		if len(resp.Rows) >= maxRows {
			resp.Truncated = true
			break
		}
		var row []any
		if req.Text {
			var n int
			row, n = textRow(rows.RawValues(), req.CellLimit, len(resp.Rows), &resp.Cut)
			if size+n > maxResultBytes {
				if len(resp.Rows) == 0 {
					return nil, &pgErrorInfo{message: fmt.Sprintf(
						"the first row is %d MB, more than the %d MB a result may hold; select fewer or shorter columns",
						n>>20, maxResultBytes>>20)}
				}
				resp.Truncated = true
				break
			}
			size += n
		} else {
			vals, err := rows.Values()
			if err != nil {
				return nil, &pgErrorInfo{message: "error reading row: " + sanitizeConnError(err)}
			}
			row = make([]any, len(vals))
			for i, v := range vals {
				row[i] = normalizeValue(v)
			}
		}
		resp.Rows = append(resp.Rows, row)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		e := extractPgError(err)
		return nil, &e
	}

	resp.RowCount = len(resp.Rows)
	resp.Duration = time.Since(start).Milliseconds()

	if req.Text && len(fieldDescs) > 0 {
		lookupColumnTypes(ctx, conn, fieldDescs, resp.Columns)
	}
	return resp, nil
}

// textRow turns raw text-format values into strings (nil for NULL), cutting
// values over limit bytes. It returns the row and the bytes it holds.
func textRow(raw [][]byte, limit, rowIdx int, cut *[]cutCell) ([]any, int) {
	row := make([]any, len(raw))
	n := 0
	for i, b := range raw {
		if b == nil {
			continue // SQL NULL
		}
		if limit > 0 && len(b) > limit {
			*cut = append(*cut, cutCell{Row: rowIdx, Col: i, Size: len(b)})
			b = cutUTF8(b, limit)
		}
		row[i] = string(b) // copies: RawValues is reused by the next row
		n += len(b)
	}
	return row, n
}

// cutUTF8 shortens b to at most limit bytes without splitting a character.
func cutUTF8(b []byte, limit int) []byte {
	if len(b) <= limit {
		return b
	}
	b = b[:limit]
	for i := 0; i < utf8.UTFMax && len(b) > 0; i++ {
		if r, size := utf8.DecodeLastRune(b); r != utf8.RuneError || size > 1 {
			break
		}
		b = b[:len(b)-1]
	}
	return b
}

// queryParams prepares request params for pgx. JSON numbers are passed as
// strings: pgx sends strings in text format and Postgres parses them with the
// parameter type's own input function, so 9007199254740993 or 0.1 stay exact
// (decoded as float64 they would not).
func queryParams(params []any) []any {
	out := make([]any, len(params))
	for i, p := range params {
		if n, ok := p.(json.Number); ok {
			out[i] = n.String()
		} else {
			out[i] = p
		}
	}
	return out
}

// lookupColumnTypes fills in exact type names (format_type, e.g. varchar(10),
// int4multirange, a user enum) and type categories. On failure the OID-based
// names from pgTypeToString stay.
func lookupColumnTypes(ctx context.Context, conn querier, fds []pgconn.FieldDescription, cols []columnInfo) {
	oids := make([]int64, len(fds))
	mods := make([]int32, len(fds))
	for i, fd := range fds {
		oids[i] = int64(fd.DataTypeOID)
		mods[i] = fd.TypeModifier
	}
	rows, err := conn.Query(ctx, `
		SELECT pg_catalog.format_type(x.oid::oid, x.mod), coalesce(t.typcategory::text, '')
		FROM unnest($1::int8[], $2::int4[]) WITH ORDINALITY AS x(oid, mod, ord)
		LEFT JOIN pg_catalog.pg_type t ON t.oid = x.oid::oid
		ORDER BY x.ord`, oids, mods)
	if err != nil {
		return
	}
	defer rows.Close()
	names := make([]columnInfo, 0, len(cols))
	for rows.Next() {
		var c columnInfo
		if err := rows.Scan(&c.Type, &c.Category); err != nil {
			return
		}
		names = append(names, c)
	}
	if rows.Err() != nil || len(names) != len(cols) {
		return
	}
	for i := range cols {
		cols[i].Type, cols[i].Category = names[i].Type, names[i].Category
	}
}

func writeError(w http.ResponseWriter, message, code string, position, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(errorResponse{
		Error:    message,
		Code:     code,
		Position: position,
	})
}

func validateConnectionString(conn string) error {
	if conn == "" {
		return fmt.Errorf("connection string is required")
	}
	if !strings.HasPrefix(conn, "postgres://") && !strings.HasPrefix(conn, "postgresql://") {
		return fmt.Errorf("connection string must start with postgres:// or postgresql://")
	}
	return nil
}

// sanitizeConnError removes connection strings from error messages.
// Connection URLs and password=… pairs, which must never be echoed back.
var (
	connURLPattern  = regexp.MustCompile(`postgres(ql)?://\S+`)
	passwordPattern = regexp.MustCompile(`(?i)password=\S+`)
)

// sanitizeConnError makes a connect error safe to show: it keeps the reason
// (timeout, auth failure, SSL …) but removes connection URLs and passwords.
func sanitizeConnError(err error) string {
	if err == nil {
		return ""
	}
	msg := connURLPattern.ReplaceAllString(err.Error(), "[connection]")
	return passwordPattern.ReplaceAllString(msg, "password=[hidden]")
}

type pgErrorInfo struct {
	message  string
	code     string
	position int
}

func extractPgError(err error) pgErrorInfo {
	if err == nil {
		return pgErrorInfo{}
	}
	// pgx wraps *pgconn.PgError
	type pgErr interface {
		SQLState() string
	}
	if pe, ok := err.(pgErr); ok {
		return pgErrorInfo{
			message: err.Error(),
			code:    pe.SQLState(),
		}
	}
	return pgErrorInfo{message: err.Error()}
}

func normalizeValue(v any) any {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case []byte:
		return string(val)
	case [16]uint8: // UUID
		return fmt.Sprintf("%x-%x-%x-%x-%x", val[0:4], val[4:6], val[6:8], val[8:10], val[10:16])
	default:
		return val
	}
}

// pgTypeToString maps common Postgres OIDs to readable type names. Text-mode
// results replace these with format_type names (lookupColumnTypes).
func pgTypeToString(oid uint32) string {
	switch oid {
	case 16:
		return "bool"
	case 20:
		return "int8"
	case 21:
		return "int2"
	case 23:
		return "int4"
	case 25:
		return "text"
	case 700:
		return "float4"
	case 701:
		return "float8"
	case 1043:
		return "varchar"
	case 1082:
		return "date"
	case 1114:
		return "timestamp"
	case 1184:
		return "timestamptz"
	case 1700:
		return "numeric"
	case 2950:
		return "uuid"
	case 114:
		return "json"
	case 3802:
		return "jsonb"
	default:
		return fmt.Sprintf("oid:%d", oid)
	}
}
