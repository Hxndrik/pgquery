package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func staticHandler(dir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Don't serve static files for API routes
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		path := filepath.Join(dir, filepath.Clean("/"+r.URL.Path))

		// Check if file exists
		info, err := os.Stat(path)
		if err != nil || info.IsDir() {
			// SPA fallback: serve index.html
			indexPath := filepath.Join(dir, "index.html")
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			http.ServeFile(w, r, indexPath)
			return
		}

		// Hashed assets (contain "." and not index.html) get long cache
		name := info.Name()
		if name != "index.html" && strings.Contains(name, ".") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		}

		http.ServeFile(w, r, path)
	}
}
