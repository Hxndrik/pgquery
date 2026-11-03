package main

import (
	"context"
	"errors"
	"net"
	"testing"
)

func TestIsPrivateIP(t *testing.T) {
	cases := map[string]bool{
		"127.0.0.1": true, "10.1.2.3": true, "192.168.0.10": true, "172.16.5.4": true,
		"169.254.169.254": true, "::1": true, "fd00::1": true, "0.0.0.0": true,
		"8.8.8.8": false, "203.0.113.10": false, "2606:4700::1111": false,
	}
	for addr, want := range cases {
		if got := isPrivateIP(net.ParseIP(addr)); got != want {
			t.Errorf("isPrivateIP(%s) = %v, want %v", addr, got, want)
		}
	}
}

func TestConnectRejections(t *testing.T) {
	cfg := &config{BlockPrivateHosts: true}
	cases := map[string]string{
		demoConnection:                  errDemoUnavailable.msg,
		"mysql://x":                     "connection string must start with postgres:// or postgresql://",
		"postgres://u@127.0.0.1:5432/x": errBlockedHost.msg,
		"postgres://u@localhost/x":      errBlockedHost.msg,
	}
	for conn, want := range cases {
		_, err := cfg.connect(context.Background(), conn)
		if err == nil || connError(err) != want {
			t.Errorf("connect(%q) error = %v, want %q", conn, err, want)
		}
	}
}

func TestSanitizeConnError(t *testing.T) {
	cases := map[string]string{
		"failed to connect to `user=postgres database=postgres`: 10.0.0.1:5432 (db): server error: FATAL: password authentication failed for user \"postgres\" (SQLSTATE 28P01)": "failed to connect to `user=postgres database=postgres`: 10.0.0.1:5432 (db): server error: FATAL: password authentication failed for user \"postgres\" (SQLSTATE 28P01)",
		"cannot parse `postgres://u:secret@h/db`: failed": "cannot parse `[connection] failed",
		"bad dsn host=h password=secret user=u":           "bad dsn host=h password=[hidden] user=u",
	}
	for in, want := range cases {
		if got := sanitizeConnError(errors.New(in)); got != want {
			t.Errorf("sanitizeConnError(%q)\n got %q\nwant %q", in, got, want)
		}
	}
}
