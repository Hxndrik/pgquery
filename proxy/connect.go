package main

import (
	"context"
	"errors"
	"net"
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

var (
	errDemoUnavailable = clientError{"the demo database is not available on this server right now"}
	errBlockedHost     = clientError{"this server does not connect to private or local addresses"}
)

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

	if cfg.BlockPrivateHosts && !trusted {
		// Check the address actually dialed, after DNS resolution, so a
		// hostname that resolves to a private IP is caught too.
		dialer := &net.Dialer{}
		pgCfg.DialFunc = func(ctx context.Context, network, addr string) (net.Conn, error) {
			if network == "unix" {
				return nil, errBlockedHost
			}
			host, port, err := net.SplitHostPort(addr)
			if err != nil {
				return nil, err
			}
			ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
			if err != nil {
				return nil, err
			}
			for _, ip := range ips {
				if isPrivateIP(ip.IP) {
					return nil, errBlockedHost
				}
			}
			return dialer.DialContext(ctx, network, net.JoinHostPort(ips[0].IP.String(), port))
		}
		pgCfg.LookupFunc = func(ctx context.Context, host string) ([]string, error) {
			if strings.HasPrefix(host, "/") {
				return nil, errBlockedHost
			}
			return []string{host}, nil
		}
	}

	return pgx.ConnectConfig(ctx, pgCfg)
}

func isPrivateIP(ip net.IP) bool {
	return ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() || ip.IsUnspecified() || ip.IsInterfaceLocalMulticast()
}

// connError turns a connect failure into a message safe to show the user.
func connError(err error) string {
	var ce clientError
	if errors.As(err, &ce) {
		return ce.msg
	}
	return sanitizeConnError(err)
}
