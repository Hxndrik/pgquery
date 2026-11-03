# Security

## Reporting a vulnerability

Please report security issues privately through GitHub's **Report a vulnerability** button on the Security tab of this repository, not in a public issue. You'll get a reply within a few days.

## Security model

- pgquery has no authentication of its own. Anyone who can reach an instance can use it to connect to any database they have credentials for. Run it on localhost, behind a VPN, or behind an authenticating reverse proxy.
- The proxy is stateless. Connection strings are stored in the browser (localStorage) and sent with each request; they are not logged or stored on the server.
- Public instances should set `BLOCK_PRIVATE_HOSTS=true` so the proxy cannot be used to reach loopback or private network addresses.
- The demo database URL (`DEMO_DATABASE_URL`) never reaches the browser. Use a role with SELECT-only grants; `scripts/demo/seed.sql` creates one.
