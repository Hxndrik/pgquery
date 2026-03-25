package main

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
)

type schemaColumn struct {
	Name      string `json:"name"`
	Type      string `json:"type"`
	Nullable  bool   `json:"nullable"`
	IsPrimary bool   `json:"isPrimary"`
	IsUnique  bool   `json:"isUnique"`
}

type schemaTable struct {
	Name        string         `json:"name"`
	RowEstimate int64          `json:"rowEstimate"`
	Columns     []schemaColumn `json:"columns"`
}

type schemaSchema struct {
	Name   string        `json:"name"`
	Tables []schemaTable `json:"tables"`
}

type schemaResponse struct {
	Schemas []schemaSchema `json:"schemas"`
}

type schemaRequest struct {
	Connection string `json:"connection"`
}

func (cfg *config) handleSchema(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req schemaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body", "", 0, http.StatusBadRequest)
		return
	}

	if err := validateConnectionString(req.Connection); err != nil {
		writeError(w, err.Error(), "", 0, http.StatusBadRequest)
		return
	}

	connCtx, connCancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer connCancel()

	conn, err := pgx.Connect(connCtx, req.Connection)
	if err != nil {
		writeError(w, sanitizeConnError(err), "", 0, http.StatusBadGateway)
		return
	}
	defer conn.Close(context.Background())

	queryCtx, queryCancel := context.WithTimeout(r.Context(), cfg.QueryTimeout)
	defer queryCancel()

	// Introspect schema
	const introspectSQL = `
		SELECT
			n.nspname AS schema_name,
			c.relname AS table_name,
			COALESCE(s.n_live_tup, 0) AS row_estimate,
			a.attname AS column_name,
			pg_catalog.format_type(a.atttypid, a.atttypmod) AS column_type,
			NOT a.attnotnull AS nullable,
			COALESCE(
				EXISTS(
					SELECT 1 FROM pg_index i
					JOIN pg_attribute ia ON ia.attrelid = i.indrelid AND ia.attnum = ANY(i.indkey)
					WHERE i.indrelid = c.oid AND i.indisprimary AND ia.attname = a.attname
				), false
			) AS is_primary,
			COALESCE(
				EXISTS(
					SELECT 1 FROM pg_index i
					WHERE i.indrelid = c.oid AND i.indisunique
					  AND array_length(i.indkey, 1) = 1
					  AND a.attnum = i.indkey[0]
				), false
			) AS is_unique
		FROM pg_catalog.pg_class c
		JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
		JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
		LEFT JOIN pg_catalog.pg_stat_user_tables s ON s.schemaname = n.nspname AND s.relname = c.relname
		WHERE c.relkind IN ('r', 'v', 'm')
		  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
		ORDER BY n.nspname, c.relname, a.attnum`

	rows, err := conn.Query(queryCtx, introspectSQL)
	if err != nil {
		writeError(w, err.Error(), "", 0, http.StatusOK)
		return
	}
	defer rows.Close()

	// Build nested structure
	schemaMap := make(map[string]map[string]*schemaTable)
	schemaOrder := []string{}
	tableOrder := make(map[string][]string)

	for rows.Next() {
		var schemaName, tableName, columnName, columnType string
		var rowEstimate int64
		var nullable, isPrimary, isUnique bool

		if err := rows.Scan(&schemaName, &tableName, &rowEstimate, &columnName, &columnType, &nullable, &isPrimary, &isUnique); err != nil {
			continue
		}

		if _, ok := schemaMap[schemaName]; !ok {
			schemaMap[schemaName] = make(map[string]*schemaTable)
			schemaOrder = append(schemaOrder, schemaName)
		}

		if _, ok := schemaMap[schemaName][tableName]; !ok {
			schemaMap[schemaName][tableName] = &schemaTable{
				Name:        tableName,
				RowEstimate: rowEstimate,
				Columns:     []schemaColumn{},
			}
			tableOrder[schemaName] = append(tableOrder[schemaName], tableName)
		}

		schemaMap[schemaName][tableName].Columns = append(schemaMap[schemaName][tableName].Columns, schemaColumn{
			Name:      columnName,
			Type:      columnType,
			Nullable:  nullable,
			IsPrimary: isPrimary,
			IsUnique:  isUnique,
		})
	}

	if err := rows.Err(); err != nil {
		writeError(w, err.Error(), "", 0, http.StatusOK)
		return
	}

	// Assemble ordered response
	schemas := make([]schemaSchema, 0, len(schemaOrder))
	for _, sName := range schemaOrder {
		tables := make([]schemaTable, 0, len(tableOrder[sName]))
		for _, tName := range tableOrder[sName] {
			tables = append(tables, *schemaMap[sName][tName])
		}
		schemas = append(schemas, schemaSchema{
			Name:   sName,
			Tables: tables,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(schemaResponse{Schemas: schemas})
}
