package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type queryRequest struct {
	Connection string `json:"connection"`
	Query      string `json:"query"`
	Params     []any  `json:"params"`
}

type columnInfo struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type queryResponse struct {
	Columns   []columnInfo `json:"columns"`
	Rows      [][]any      `json:"rows"`
	RowCount  int          `json:"rowCount"`
	Duration  int64        `json:"duration"` // ms
	Truncated bool         `json:"truncated,omitempty"`
}

type errorResponse struct {
	Error    string `json:"error"`
	Code     string `json:"code,omitempty"`
	Position int    `json:"position,omitempty"`
}

func (cfg *config) handleQuery(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req queryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body", "", 0, http.StatusBadRequest)
		return
	}

	if err := validateConnectionString(req.Connection); err != nil {
		writeError(w, err.Error(), "", 0, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Query) == "" {
		writeError(w, "query is required", "", 0, http.StatusBadRequest)
		return
	}

	// Connect with timeout
	connCtx, connCancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer connCancel()

	conn, err := pgx.Connect(connCtx, req.Connection)
	if err != nil {
		writeError(w, sanitizeConnError(err), "", 0, http.StatusBadGateway)
		return
	}
	defer conn.Close(context.Background())

	// Execute with query timeout
	queryCtx, queryCancel := context.WithTimeout(r.Context(), cfg.QueryTimeout)
	defer queryCancel()

	start := time.Now()

	rows, err := conn.Query(queryCtx, req.Query, req.Params...)
	if err != nil {
		pgErr := extractPgError(err)
		writeError(w, pgErr.message, pgErr.code, pgErr.position, http.StatusOK)
		return
	}
	defer rows.Close()

	// Build columns
	fieldDescs := rows.FieldDescriptions()
	columns := make([]columnInfo, len(fieldDescs))
	for i, fd := range fieldDescs {
		columns[i] = columnInfo{
			Name: fd.Name,
			Type: pgTypeToString(fd.DataTypeOID),
		}
	}

	// Collect rows
	var resultRows [][]any
	truncated := false

	for rows.Next() {
		if len(resultRows) >= cfg.MaxRows {
			truncated = true
			break
		}
		vals, err := rows.Values()
		if err != nil {
			writeError(w, "error reading row: "+sanitizeConnError(err), "", 0, http.StatusOK)
			return
		}
		// Convert non-JSON-serializable types to strings
		row := make([]any, len(vals))
		for i, v := range vals {
			row[i] = normalizeValue(v)
		}
		resultRows = append(resultRows, row)
	}

	if err := rows.Err(); err != nil {
		pgErr := extractPgError(err)
		writeError(w, pgErr.message, pgErr.code, pgErr.position, http.StatusOK)
		return
	}

	duration := time.Since(start).Milliseconds()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(queryResponse{
		Columns:   columns,
		Rows:      resultRows,
		RowCount:  len(resultRows),
		Duration:  duration,
		Truncated: truncated,
	})
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
func sanitizeConnError(err error) string {
	if err == nil {
		return ""
	}
	msg := err.Error()
	// Remove anything that looks like a connection URL
	if idx := strings.Index(msg, "postgres"); idx > 0 {
		msg = msg[:idx] + "[connection]"
	}
	return msg
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

// pgTypeToString maps common Postgres OIDs to readable type names.
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
