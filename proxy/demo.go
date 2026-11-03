package main

import (
	"context"
	"crypto/rand"
	_ "embed"
	"encoding/hex"
	"fmt"
	"log"
	"net/url"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
)

//go:embed demo/seed.sql
var demoSeedSQL string

// demoDB keeps the hosted demo database seeded. It connects with the admin
// URL from DEMO_DATABASE_URL, (re)creates the sample schema and a SELECT-only
// `demo` role with a fresh random password, and hands out a URL for that role
// only. The admin URL never leaves this type.
type demoDB struct {
	adminURL string
	interval time.Duration // 0: seed once at startup, never reset

	mu  sync.RWMutex
	url string // demo-role URL; empty until the first seed succeeds
}

func newDemoDB(adminURL string, interval time.Duration) *demoDB {
	return &demoDB{adminURL: adminURL, interval: interval}
}

// URL returns the read-only demo-role URL, or "" while not yet seeded.
func (d *demoDB) URL() string {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.url
}

// run seeds now, retrying with backoff on failure, then re-seeds every interval.
func (d *demoDB) run(ctx context.Context) {
	backoff := time.Minute
	for {
		start := time.Now()
		if err := d.seed(ctx); err != nil {
			log.Printf("demo: seeding failed, retrying in %s: %v", backoff, err)
			if !sleep(ctx, backoff) {
				return
			}
			backoff = min(backoff*2, 30*time.Minute)
			continue
		}
		backoff = time.Minute
		log.Printf("demo: seeded in %s", time.Since(start).Round(time.Millisecond))
		if d.interval <= 0 || !sleep(ctx, d.interval) {
			return
		}
	}
}

func (d *demoDB) seed(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	conn, err := pgx.Connect(ctx, d.adminURL)
	if err != nil {
		// Server log only. pgx connect errors name the user and host, never the password.
		return fmt.Errorf("connect: %w", err)
	}
	defer conn.Close(context.Background())

	// The whole script in one transaction, so a failed reset leaves the
	// previous data in place.
	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())
	if _, err := tx.Exec(ctx, demoSeedSQL); err != nil {
		return fmt.Errorf("seed script: %w", err)
	}

	password, err := randomPassword()
	if err != nil {
		return err
	}
	// ALTER ROLE takes no bind parameters; let Postgres quote the literal.
	var alter string
	if err := tx.QueryRow(ctx, "SELECT format('ALTER ROLE demo PASSWORD %L', $1::text)", password).Scan(&alter); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, alter); err != nil {
		return fmt.Errorf("set demo password: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}

	roleURL, err := demoRoleURL(d.adminURL, password)
	if err != nil {
		return err
	}
	d.mu.Lock()
	d.url = roleURL
	d.mu.Unlock()

	// Fresh planner statistics and an empty pg_stat_statements, best effort.
	_, _ = conn.Exec(ctx, "ANALYZE")
	_, _ = conn.Exec(ctx, "DO $$ BEGIN PERFORM extensions.pg_stat_statements_reset(); EXCEPTION WHEN others THEN NULL; END $$")
	return nil
}

// demoRoleURL swaps the admin credentials in a postgres:// URL for the demo role's.
func demoRoleURL(adminURL, password string) (string, error) {
	u, err := url.Parse(adminURL)
	if err != nil || (u.Scheme != "postgres" && u.Scheme != "postgresql") || u.Host == "" {
		return "", fmt.Errorf("DEMO_DATABASE_URL must be a postgres:// URL")
	}
	u.User = url.UserPassword("demo", password)
	return u.String(), nil
}

func randomPassword() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// sleep waits for d or until ctx is done; false means ctx ended.
func sleep(ctx context.Context, d time.Duration) bool {
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-t.C:
		return true
	case <-ctx.Done():
		return false
	}
}
