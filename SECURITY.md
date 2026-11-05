# Security

## Reporting a vulnerability

Please report security issues privately through GitHub's **Report a vulnerability** button on the Security tab of this repository, not in a public issue. You'll get a reply within a few days.

## Security model

### Hosted app (pgquery.dev)

- pgquery.dev runs the same open-source image, with a demo database configured. Because of that it refuses connections to loopback, private and link-local addresses, so it cannot be used to reach anyone's internal network.
- Saved connections live in your browser (localStorage). Each request carries its connection string to the proxy, which connects, runs the query and returns the rows. The proxy's code does not log or store connection strings or queries.
- S3 connections follow the same rules: the proxy refuses private and local endpoints, keys are saved in the browser and sent with each request, and the proxy doesn't log or store them. Use a key limited to one bucket.
- On every instance, S3 previews and downloads use sealed links (AES-GCM, a key generated when the server starts) that expire after an hour, so the access and secret keys never appear in a URL. Restarting the server invalidates them. Everything except a PDF is sent as an attachment under `Content-Security-Policy: sandbox`, so object content from a bucket can't run as a page on the app's origin.
- Use a database role with only the rights you need. If queries must not leave your own network, self-host.

### Self-hosted

- pgquery has no authentication of its own. Anyone who can reach an instance can use it to connect to any database they have credentials for. Run it on localhost, behind a VPN, or behind an authenticating reverse proxy.
- The proxy is stateless. Connection strings are stored in the browser (localStorage) and sent with each request; they are not logged or stored on the server.
- An instance with a demo database (`DEMO_DATABASE_URL`) or demo bucket (`DEMO_S3_ENDPOINT`) is treated as public: it refuses connections to loopback, private and link-local addresses, checked on the resolved IP, unless `ALLOW_PRIVATE_HOSTS=true`.
- `DEMO_DATABASE_URL` is an admin URL and stays on the server. Visitors are served through a `demo` role with SELECT-only grants, no temp tables, a 5 s statement timeout and a random password that changes on every reset. Give the demo its own database; the seed drops and recreates its tables.
- `DEMO_S3_ACCESS_KEY` and `DEMO_S3_SECRET_KEY` are root keys for the demo bucket and stay on the server. Clients use the `s3://demo.pgquery` endpoint, and the proxy refuses every upload, delete and new folder on it. Give the demo its own bucket: the seed removes every object that isn't part of the sample.
