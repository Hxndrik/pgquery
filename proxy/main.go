package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
)

func main() {
	port := getEnv("PORT", "54280")
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

	maxUploadMB := int64(defaultMaxUploadMB)
	if v := os.Getenv("MAX_UPLOAD_MB"); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			maxUploadMB = n
		}
	}

	cfg := &config{
		QueryTimeout: queryTimeout,
		MaxRows:      maxRows,
		MaxUploadMB:  maxUploadMB,
	}

	// A configured demo (database or bucket) means this is a public instance:
	// seed it, keep it fresh, and refuse private/loopback targets unless told
	// otherwise.
	resetEvery := 24 * time.Hour
	if v := os.Getenv("DEMO_RESET_INTERVAL"); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			resetEvery = d
		}
	}
	if adminURL := os.Getenv("DEMO_DATABASE_URL"); adminURL != "" {
		cfg.Demo = newDemoDB(adminURL, resetEvery)
		go cfg.Demo.run(context.Background())
	}
	if endpoint := os.Getenv("DEMO_S3_ENDPOINT"); endpoint != "" {
		req := s3Request{
			Endpoint:  endpoint,
			AccessKey: os.Getenv("DEMO_S3_ACCESS_KEY"),
			SecretKey: os.Getenv("DEMO_S3_SECRET_KEY"),
			Bucket:    getEnv("DEMO_S3_BUCKET", "pgquery-demo"),
			Region:    getEnv("DEMO_S3_REGION", "us-east-1"),
		}
		if err := req.validate(); err != nil {
			log.Printf("demo bucket disabled: DEMO_S3_ENDPOINT and DEMO_S3_ACCESS_KEY / DEMO_S3_SECRET_KEY must all be set (%v)", err)
		} else {
			cfg.DemoS3 = newDemoS3(req, resetEvery)
			go cfg.DemoS3.run(context.Background())
		}
	}
	cfg.BlockPrivateHosts = (cfg.Demo != nil || cfg.DemoS3 != nil) && os.Getenv("ALLOW_PRIVATE_HOSTS") != "true"

	mux := http.NewServeMux()
	mux.HandleFunc("/api/query", cfg.handleQuery)
	mux.HandleFunc("/api/schema", cfg.handleSchema)
	mux.HandleFunc("/api/test", cfg.handleTest)

	// S3 routes
	mux.HandleFunc("/api/s3/test", cfg.handleS3Test)
	mux.HandleFunc("/api/s3/objects", cfg.handleS3Objects)
	mux.HandleFunc("/api/s3/bucket/stats", cfg.handleS3Stats)
	mux.HandleFunc("/api/s3/folder/create", cfg.handleS3FolderCreate)
	mux.HandleFunc("/api/s3/object/meta", cfg.handleS3ObjectMeta)
	mux.HandleFunc("/api/s3/object/delete", cfg.handleS3ObjectDelete)
	mux.HandleFunc(uploadPath, cfg.handleS3ObjectUpload)
	mux.HandleFunc("/api/s3/object/link", cfg.handleS3ObjectLink)
	mux.HandleFunc("/api/s3/object/download", cfg.handleS3ObjectDownload)

	mux.HandleFunc("/", staticHandler(staticDir))

	rl := newRateLimiter(rateLimitRPM)
	handler := withMiddleware(mux, rl)

	log.Printf("pgquery listening on :%s (demo: %t, private hosts blocked: %t)", port, cfg.Demo != nil, cfg.BlockPrivateHosts)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}

type config struct {
	QueryTimeout      time.Duration
	MaxRows           int
	MaxUploadMB       int64   // largest S3 upload; 0 means defaultMaxUploadMB
	Demo              *demoDB // set when DEMO_DATABASE_URL is configured
	DemoS3            *demoS3 // set when DEMO_S3_ENDPOINT is configured
	BlockPrivateHosts bool    // on with a demo (public instance) unless ALLOW_PRIVATE_HOSTS=true

	linksOnce sync.Once
	linkSeal  *linkSealer // signs S3 download links; created on first use
	linkErr   error
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
