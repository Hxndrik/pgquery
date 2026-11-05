package main

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
)

// demoConnection is the connection string the frontend sends for the hosted
// demo database. The proxy swaps it for the read-only demo role's URL (see
// demo.go), so no credentials reach the browser.
const demoConnection = "postgres://demo@demo.pgquery/demo"

// clientError is a connect failure whose message is safe to show as-is.
type clientError struct{ msg string }

func (e clientError) Error() string { return e.msg }

var errDemoUnavailable = clientError{"the demo database is not available on this server right now"}

// connect validates a client-supplied connection string, resolves the demo
// sentinel, applies the private-host policy and opens a connection.
func (cfg *config) connect(ctx context.Context, connString string) (*pgx.Conn, error) {
	trusted := false
	if connString == demoConnection {
		demoURL := ""
		if cfg.Demo != nil {
			demoURL = cfg.Demo.URL()
		}
		if demoURL == "" {
			return nil, errDemoUnavailable
		}
		connString, trusted = demoURL, true
	} else if err := validateConnectionString(connString); err != nil {
		return nil, clientError{err.Error()}
	}

	pgCfg, err := pgx.ParseConfig(connString)
	if err != nil {
		return nil, clientError{"invalid connection string: " + sanitizeConnError(err)}
	}

	// Print floats exactly (the default on Postgres 12+), so text values
	// written back unchanged keep their value on older servers too.
	if _, set := pgCfg.RuntimeParams["extra_float_digits"]; !set {
		pgCfg.RuntimeParams["extra_float_digits"] = "3"
	}

	if cfg.BlockPrivateHosts && !trusted {
		pgCfg.DialFunc = guardedDial
		pgCfg.LookupFunc = func(ctx context.Context, host string) ([]string, error) {
			if strings.HasPrefix(host, "/") {
				return nil, errBlockedHost
			}
			return []string{host}, nil
		}
	}

	return pgx.ConnectConfig(ctx, pgCfg)
}

// connError turns a connect failure into a message safe to show the user.
func connError(err error) string {
	var ce clientError
	if errors.As(err, &ce) {
		return ce.msg
	}
	return sanitizeConnError(err)
}
