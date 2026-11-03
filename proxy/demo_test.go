package main

import (
	"context"
	"net/url"
	"strings"
	"testing"
)

func TestDemoRoleURL(t *testing.T) {
	got, err := demoRoleURL("postgresql://postgres:s3cret@db.example.com:5432/postgres?sslmode=require", "pw123")
	if err != nil {
		t.Fatal(err)
	}
	u, _ := url.Parse(got)
	if u.User.Username() != "demo" {
		t.Errorf("user = %q, want demo", u.User.Username())
	}
	if p, _ := u.User.Password(); p != "pw123" {
		t.Errorf("password = %q, want pw123", p)
	}
	if strings.Contains(got, "s3cret") || strings.Contains(got, "postgres:") {
		t.Errorf("admin credentials leaked into %q", got)
	}
	if u.Host != "db.example.com:5432" || u.Path != "/postgres" || u.Query().Get("sslmode") != "require" {
		t.Errorf("host/db/params not preserved: %q", got)
	}

	if _, err := demoRoleURL("host=db user=postgres", "x"); err == nil {
		t.Error("key=value admin string should be rejected")
	}
}

func TestDemoUnavailableUntilSeeded(t *testing.T) {
	cfg := &config{Demo: newDemoDB("postgres://admin:pw@db.example.com/postgres", 0)}
	_, err := cfg.connect(context.Background(), demoConnection)
	if err == nil || connError(err) != errDemoUnavailable.msg {
		t.Fatalf("got %v, want %q", err, errDemoUnavailable.msg)
	}
}
