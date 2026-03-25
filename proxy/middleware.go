package main

import (
	"net/http"
	"sync"
	"time"
)

// rateLimiter implements a sliding window rate limiter per IP.
type rateLimiter struct {
	mu      sync.Mutex
	windows map[string][]time.Time
	rpm     int
}

func newRateLimiter(rpm int) *rateLimiter {
	return &rateLimiter{
		windows: make(map[string][]time.Time),
		rpm:     rpm,
	}
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	window := now.Add(-time.Minute)

	times := rl.windows[ip]
	// Evict old entries
	filtered := times[:0]
	for _, t := range times {
		if t.After(window) {
			filtered = append(filtered, t)
		}
	}
	if len(filtered) >= rl.rpm {
		rl.windows[ip] = filtered
		return false
	}
	rl.windows[ip] = append(filtered, now)
	return true
}

func withMiddleware(next http.Handler, rl *rateLimiter) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Rate limiting (API routes only)
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			ip := r.RemoteAddr
			// Strip port
			for i := len(ip) - 1; i >= 0; i-- {
				if ip[i] == ':' {
					ip = ip[:i]
					break
				}
			}
			if !rl.allow(ip) {
				w.Header().Set("Retry-After", "60")
				http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
				return
			}

			// Body size limit: 1MB
			r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		}

		next.ServeHTTP(w, r)
	})
}
