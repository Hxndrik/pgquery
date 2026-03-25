package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type testRequest struct {
	Connection string `json:"connection"`
}

type testResponse struct {
	OK       bool   `json:"ok"`
	Version  string `json:"version,omitempty"`
	Database string `json:"database,omitempty"`
	Error    string `json:"error,omitempty"`
}

func (cfg *config) handleTest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req testRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body", "", 0, http.StatusBadRequest)
		return
	}

	if err := validateConnectionString(req.Connection); err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(testResponse{OK: false, Error: err.Error()})
		return
	}

	connCtx, connCancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer connCancel()

	conn, err := pgx.Connect(connCtx, req.Connection)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(testResponse{OK: false, Error: sanitizeConnError(err)})
		return
	}
	defer conn.Close(context.Background())

	queryCtx, queryCancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer queryCancel()

	var version, database string
	err = conn.QueryRow(queryCtx, "SELECT version(), current_database()").Scan(&version, &database)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(testResponse{OK: false, Error: err.Error()})
		return
	}

	// Trim verbose version string to just "PostgreSQL X.Y"
	if idx := strings.Index(version, " on "); idx > 0 {
		version = version[:idx]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(testResponse{
		OK:       true,
		Version:  version,
		Database: database,
	})
}
