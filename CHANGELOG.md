# Changelog

## [1.0.1](https://github.com/Hxndrik/pgquery/compare/v1.0.0...v1.0.1) (2026-11-03)


### Bug Fixes

* clearer calls to action, automated releases, tidy contributor docs ([#8](https://github.com/Hxndrik/pgquery/issues/8)) ([3df2098](https://github.com/Hxndrik/pgquery/commit/3df2098ee03797a29dfc9b7d6e64a642e8cbf4b4))

## 1.0.0

- New look: ink on paper with a dark mode, Tuple the pixel elephant, pixel icons.
- EXPLAIN / EXPLAIN ANALYZE plan viewer.
- Schema plate export (SVG and PNG) from the schema map.
- One-click demo database: set `DEMO_DATABASE_URL` and the app seeds a sample store, serves it through a read-only role and resets it daily.
- Instances with a demo refuse private and local addresses (`ALLOW_PRIVATE_HOSTS=true` to opt out).
- Default port is now 54280.
- Website and guides are prerendered static pages; the app lives at `/app`.
- Multi-arch Docker image published to `ghcr.io/hxndrik/pgquery`.
