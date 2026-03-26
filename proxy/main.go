package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

func main() {
	port := getEnv("PORT", "28001")
	staticDir := getEnv("STATIC_DIR", "../frontend/dist")

	rateLimitRPM := 600
	if v := os.Getenv("RATE_LIMIT_RPM"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			rateLimitRPM = n
		}
	}

	queryTimeout := 30 * time.Second
	if v := os.Getenv("MAX_QUERY_TIMEOUT"); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			queryTimeout = d
		}
	}

	maxRows := 10000
	if v := os.Getenv("MAX_ROWS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			maxRows = n
		}
	}

	cfg := &config{
		QueryTimeout: queryTimeout,
		MaxRows:      maxRows,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/query", cfg.handleQuery)
	mux.HandleFunc("/api/schema", cfg.handleSchema)
	mux.HandleFunc("/api/test", cfg.handleTest)

	// S3 routes
	mux.HandleFunc("/api/s3/test", handleS3Test)
	mux.HandleFunc("/api/s3/objects", handleS3Objects)
	mux.HandleFunc("/api/s3/object/meta", handleS3ObjectMeta)
	mux.HandleFunc("/api/s3/object/delete", handleS3ObjectDelete)
	mux.HandleFunc("/api/s3/object/upload", handleS3ObjectUpload)
	mux.HandleFunc("/api/s3/object/download", handleS3ObjectDownload)

	mux.HandleFunc("/", staticHandler(staticDir))

	rl := newRateLimiter(rateLimitRPM)
	handler := withMiddleware(mux, rl)

	log.Printf("pgquery proxy listening on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}

type config struct {
	QueryTimeout time.Duration
	MaxRows      int
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
