package main

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

func TestCutUTF8(t *testing.T) {
	s := []byte("ab🐘cd") // the elephant is 4 bytes, at 2..5
	for limit, want := range map[int]string{0: "", 2: "ab", 3: "ab", 5: "ab", 6: "ab🐘", 100: "ab🐘cd"} {
		got := cutUTF8(s, limit)
		if string(got) != want || !utf8.Valid(got) {
			t.Errorf("cutUTF8(%d) = %q, want %q", limit, got, want)
		}
	}
	// A real U+FFFD at the end is a whole character and stays.
	if got := cutUTF8([]byte("a�b"), 4); string(got) != "a�" {
		t.Errorf("cutUTF8 dropped a complete U+FFFD: %q", got)
	}
}

func TestTextRow(t *testing.T) {
	var cut []cutCell
	row, n := textRow([][]byte{[]byte("short"), nil, []byte("0123456789")}, 4, 7, &cut)
	if row[0] != "shor" {
		t.Errorf("row[0] = %v", row[0])
	}
	if row[1] != nil {
		t.Errorf("NULL became %v", row[1])
	}
	if row[2] != "0123" || n != 8 {
		t.Errorf("row[2] = %v, n = %d", row[2], n)
	}
	want := []cutCell{{Row: 7, Col: 0, Size: 5}, {Row: 7, Col: 2, Size: 10}}
	if len(cut) != 2 || cut[0] != want[0] || cut[1] != want[1] {
		t.Errorf("cut = %+v, want %+v", cut, want)
	}

	cut = nil
	row, _ = textRow([][]byte{[]byte("0123456789")}, 0, 0, &cut)
	if row[0] != "0123456789" || cut != nil {
		t.Errorf("limit 0 must not cut: %v %v", row, cut)
	}
}

func TestQueryParamsKeepNumbersExact(t *testing.T) {
	var req queryRequest
	dec := json.NewDecoder(strings.NewReader(`{"params":[9007199254740993, 0.1000000000000000055511151231257827, "x", true, null]}`))
	dec.UseNumber()
	if err := dec.Decode(&req); err != nil {
		t.Fatal(err)
	}
	got := queryParams(req.Params)
	want := []any{"9007199254740993", "0.1000000000000000055511151231257827", "x", true, nil}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("param %d = %#v, want %#v", i, got[i], want[i])
		}
	}
}

// TestTypeEdgeCasesRoundTrip runs against a real Postgres when
// PGQUERY_TEST_DATABASE_URL is set (an admin URL to a scratch database). It
// loads the demo seed in a transaction that is rolled back, reads
// type_edge_cases in text mode, writes every value back exactly as the table
// editor does, and checks nothing changed.
func TestTypeEdgeCasesRoundTrip(t *testing.T) {
	url := os.Getenv("PGQUERY_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("PGQUERY_TEST_DATABASE_URL not set")
	}
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(ctx)
	tx, err := conn.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, demoSeedSQL); err != nil {
		t.Fatalf("seed: %v", err)
	}

	read := func() *queryResponse {
		t.Helper()
		resp, qErr := runQuery(ctx, tx, queryRequest{Query: "SELECT * FROM type_edge_cases ORDER BY id", Text: true}, 1000)
		if qErr != nil {
			t.Fatalf("text-mode SELECT *: %s", qErr.message)
		}
		return resp
	}
	before := read()

	col := map[string]int{}
	for i, c := range before.Columns {
		col[c.Name] = i
	}
	byID := map[string][]any{}
	for _, r := range before.Rows {
		byID[r[0].(string)] = r
	}

	// Values come through exactly as Postgres prints them.
	checks := []struct{ id, col, want string }{
		{"9007199254740993", "id", "9007199254740993"},
		{"9007199254740993", "c_numeric", "123456789012345678901234567890.123456789012345678901234567890"},
		{"9007199254740993", "c_bytea", `\x00ff80fe`},
		{"9007199254740993", "c_date", "5874897-12-31"},
		{"9007199254740993", "c_inet", "2001:db8::1/64"},
		{"9007199254740993", "c_int_matrix", "{{1,2,3},{4,5,6},{7,8,9}}"},
		{"9007199254740992", "c_float4", "NaN"},
		{"9007199254740992", "c_float8", "Infinity"},
		{"9007199254740992", "c_date", "infinity"},
		{"9007199254740992", "c_json", "null"},
		{"1", "c_interval", "1 year 2 mons 3 days 04:05:06.789"},
		{"1", "c_inet", "192.168.1.10"},
		{"1", "c_json", `{"b": 1, "a": 2}`},
		{"1", "c_float8", "0.1"},
		{"2", "c_text", ""},
	}
	for _, c := range checks {
		if got := byID[c.id][col[c.col]]; got != c.want {
			t.Errorf("row %s %s = %#v, want %q", c.id, c.col, got, c.want)
		}
	}
	if got := byID["-9223372036854775808"][col["c_text"]]; got != nil {
		t.Errorf("SQL NULL came back as %#v", got)
	}
	if !strings.Contains(byID["9007199254740993"][col["c_json"]].(string), `"a": 2, "a": 3, "big": 12345678901234567890`) {
		t.Errorf("json not verbatim: %v", byID["9007199254740993"][col["c_json"]])
	}

	types := map[string][2]string{
		"id": {"bigint", "N"}, "c_numeric_scaled": {"numeric(20,10)", "N"}, "c_varchar": {"character varying(10)", "S"},
		"c_bool": {"boolean", "B"}, "c_timestamptz": {"timestamp with time zone", "D"}, "c_int_array": {"integer[]", "A"},
		"c_enum": {"order_status", "E"}, "c_composite": {"edge_pair", "C"}, "c_jsonb": {"jsonb", "U"},
	}
	for name, want := range types {
		c := before.Columns[col[name]]
		if c.Type != want[0] || c.Category != want[1] {
			t.Errorf("%s type = %q/%q, want %q/%q", name, c.Type, c.Category, want[0], want[1])
		}
	}

	// Write every value back the way the table editor does: text params, the
	// primary key exactly as it was read (a JSON number in the request would
	// arrive as json.Number).
	for _, r := range before.Rows {
		for i, c := range before.Columns {
			if c.Name == "id" {
				continue
			}
			sql := `UPDATE type_edge_cases SET ` + pgx.Identifier{c.Name}.Sanitize() + ` = $1 WHERE id = $2 RETURNING id::text`
			resp, qErr := runQuery(ctx, tx, queryRequest{Query: sql, Params: []any{r[i], json.Number(r[0].(string))}}, 1000)
			if qErr != nil {
				t.Fatalf("write back row %v %s = %#v: %s", r[0], c.Name, r[i], qErr.message)
			}
			if len(resp.Rows) != 1 || resp.Rows[0][0] != r[0] {
				t.Fatalf("write back row %v %s hit %v", r[0], c.Name, resp.Rows)
			}
		}
	}
	after := read()
	for ri := range before.Rows {
		for ci := range before.Columns {
			if before.Rows[ri][ci] != after.Rows[ri][ci] {
				t.Errorf("row %v %s changed: %#v -> %#v", before.Rows[ri][0], before.Columns[ci].Name, before.Rows[ri][ci], after.Rows[ri][ci])
			}
		}
	}

	// Cut cells and the response byte budget.
	resp, qErr := runQuery(ctx, tx, queryRequest{Query: "SELECT c_text_large FROM type_edge_cases WHERE id = 9007199254740993", Text: true, CellLimit: 1000}, 1000)
	if qErr != nil {
		t.Fatal(qErr.message)
	}
	if len(resp.Rows[0][0].(string)) != 1000 || len(resp.Cut) != 1 || resp.Cut[0].Size != 200000 {
		t.Errorf("cut: %d bytes, %+v", len(resp.Rows[0][0].(string)), resp.Cut)
	}
	resp, qErr = runQuery(ctx, tx, queryRequest{Query: "SELECT repeat('x', 1 << 20) FROM generate_series(1, 40)", Text: true}, 1000)
	if qErr != nil {
		t.Fatal(qErr.message)
	}
	if !resp.Truncated || len(resp.Rows) != maxResultBytes>>20 {
		t.Errorf("budget: truncated=%v rows=%d", resp.Truncated, len(resp.Rows))
	}

	// Typed mode (catalog pages) still decodes numbers and booleans.
	resp, qErr = runQuery(ctx, tx, queryRequest{Query: "SELECT 1::int AS n, true AS b, $1::int8 AS p", Params: []any{json.Number("42")}}, 1000)
	if qErr != nil {
		t.Fatal(qErr.message)
	}
	if resp.Rows[0][0] != int32(1) || resp.Rows[0][1] != true || resp.Rows[0][2] != int64(42) {
		t.Errorf("typed row = %#v", resp.Rows[0])
	}
}
