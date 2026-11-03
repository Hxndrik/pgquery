# Changelog

## 1.0.0

- New look: ink on paper with a dark mode, Tuple the pixel elephant, pixel icons.
- EXPLAIN / EXPLAIN ANALYZE plan viewer.
- Schema plate export (SVG and PNG) from the schema map.
- One-click demo database: set `DEMO_DATABASE_URL` and the app seeds a sample store, serves it through a read-only role and resets it daily.
- Instances with a demo refuse private and local addresses (`ALLOW_PRIVATE_HOSTS=true` to opt out).
- Default port is now 54280.
- Website and guides are prerendered static pages; the app lives at `/app`.
- Multi-arch Docker image published to `ghcr.io/hxndrik/pgquery`.
