package main

import (
	"context"
	"net"
	"net/http"
	"time"
)

// errBlockedHost is returned when a public instance is asked to reach a
// private or local address.
var errBlockedHost = clientError{"this server does not connect to private or local addresses"}

func isPrivateIP(ip net.IP) bool {
	return ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() || ip.IsUnspecified() || ip.IsInterfaceLocalMulticast()
}

// guardedDial resolves the host, refuses the connection when any address it
// resolves to is private or local, and dials the address it checked. Checking
// the address actually dialed, after DNS resolution, also catches a hostname
// that resolves to a private IP, and the dial itself can't be redirected to a
// different address in between. Postgres and S3 connections share it.
func guardedDial(ctx context.Context, network, addr string) (net.Conn, error) {
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
	var dialer net.Dialer
	return dialer.DialContext(ctx, network, net.JoinHostPort(ips[0].IP.String(), port))
}

// Shared HTTP transports for S3 requests. The guarded one is used for
// endpoints a client supplies on a public instance; it ignores proxy
// environment variables, which would otherwise move the dial away from the
// address that was checked.
var (
	guardedTransport = newTransport(true)
	openTransport    = newTransport(false)
)

func newTransport(guarded bool) *http.Transport {
	t := &http.Transport{
		MaxIdleConns:          32,
		MaxIdleConnsPerHost:   4,
		IdleConnTimeout:       60 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 30 * time.Second,
		ForceAttemptHTTP2:     true,
	}
	if guarded {
		t.DialContext = guardedDial
	} else {
		t.Proxy = http.ProxyFromEnvironment
		t.DialContext = (&net.Dialer{Timeout: 10 * time.Second}).DialContext
	}
	return t
}
