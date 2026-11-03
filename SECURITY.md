# Security

## Reporting a vulnerability

Please report security issues privately through GitHub's **Report a vulnerability** button on the Security tab of this repository, not in a public issue. You'll get a reply within a few days.

## Security model

- pgquery has no authentication of its own. Anyone who can reach an instance can use it to connect to any database they have credentials for. Run it on localhost, behind a VPN, or behind an authenticating reverse proxy.
- The proxy is stateless. Connection strings are stored in the browser (localStorage) and sent with each request; they are not logged or stored on the server.
- An instance with a demo database (`DEMO_DATABASE_URL`) is treated as public: it refuses connections to loopback, private and link-local addresses, checked on the resolved IP, unless `ALLOW_PRIVATE_HOSTS=true`.
- `DEMO_DATABASE_URL` is an admin URL and stays on the server. Visitors are served through a `demo` role with SELECT-only grants, no temp tables, a 5 s statement timeout and a random password that changes on every reset. Give the demo its own database; the seed drops and recreates its tables.
