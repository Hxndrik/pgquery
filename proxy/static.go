package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// staticHandler serves the built frontend:
//   - /assets/*: hashed files, cached for a year
//   - /app and /app/*: the React app (SPA fallback to app/index.html)
//   - /<page>/: prerendered pages (<page>/index.html); /<page> redirects to /<page>/
//   - anything else that doesn't exist: 404.html with status 404
func staticHandler(dir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		urlPath := filepath.Clean("/" + r.URL.Path)
		path := filepath.Join(dir, urlPath)

		if info, err := os.Stat(path); err == nil {
			if info.IsDir() {
				index := filepath.Join(path, "index.html")
				if _, err := os.Stat(index); err == nil {
					if !strings.HasSuffix(r.URL.Path, "/") {
						http.Redirect(w, r, r.URL.Path+"/", http.StatusMovedPermanently)
						return
					}
					serveHTML(w, r, index, http.StatusOK)
					return
				}
			} else {
				if strings.HasPrefix(urlPath, "/assets/") {
					w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				} else {
					w.Header().Set("Cache-Control", "public, max-age=300")
				}
				http.ServeFile(w, r, path)
				return
			}
		}

		if urlPath == "/app" || strings.HasPrefix(urlPath, "/app/") {
			serveHTML(w, r, filepath.Join(dir, "app", "index.html"), http.StatusOK)
			return
		}

		serveHTML(w, r, filepath.Join(dir, "404.html"), http.StatusNotFound)
	}
}

// serveHTML writes an HTML file with the given status. http.ServeFile would
// redirect */index.html and always answer 200, so this reads the file itself.
func serveHTML(w http.ResponseWriter, r *http.Request, path string, status int) {
	body, err := os.ReadFile(path)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.WriteHeader(status)
	if r.Method != http.MethodHead {
		_, _ = w.Write(body)
	}
}
