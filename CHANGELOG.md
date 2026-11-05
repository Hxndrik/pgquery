# Changelog

## [1.4.0](https://github.com/Hxndrik/pgquery/compare/v1.3.0...v1.4.0) (2026-11-05)


### Features

* new hero for Postgres and S3, phone-friendly site and app ([#22](https://github.com/Hxndrik/pgquery/issues/22)) ([1c31bef](https://github.com/Hxndrik/pgquery/commit/1c31befead878d8b5b6145075f573f3a1b3530f6))

## [1.3.0](https://github.com/Hxndrik/pgquery/compare/v1.2.2...v1.3.0) (2026-11-05)


### Features

* S3 demo bucket, safer S3 requests, paging and folders ([#20](https://github.com/Hxndrik/pgquery/issues/20)) ([8124679](https://github.com/Hxndrik/pgquery/commit/81246793333c855b97349d6d7427b583a52315a8))

## [1.2.2](https://github.com/Hxndrik/pgquery/compare/v1.2.1...v1.2.2) (2026-11-03)


### Bug Fixes

* exact values for every Postgres type, read and write ([#17](https://github.com/Hxndrik/pgquery/issues/17)) ([d55d805](https://github.com/Hxndrik/pgquery/commit/d55d8058ec514f551ec599fcbb03fc066dde59dc))

## [1.2.1](https://github.com/Hxndrik/pgquery/compare/v1.2.0...v1.2.1) (2026-11-03)


### Bug Fixes

* parse the release pull request JSON in the shell ([#15](https://github.com/Hxndrik/pgquery/issues/15)) ([b6cf536](https://github.com/Hxndrik/pgquery/commit/b6cf5367f1bc85e93dc3073002967252d2af1312))

## [1.2.0](https://github.com/Hxndrik/pgquery/compare/v1.1.0...v1.2.0) (2026-11-03)


### Features

* compare with pgweb and DbGate, warn on unencrypted connections ([#12](https://github.com/Hxndrik/pgquery/issues/12)) ([ef70e9e](https://github.com/Hxndrik/pgquery/commit/ef70e9e47797d869329ded4613599f54264def49))

## [1.1.0](https://github.com/Hxndrik/pgquery/compare/v1.0.1...v1.1.0) (2026-11-03)


### Features

* honest comparisons and connection guides, one-accent app UI, video hero ([#10](https://github.com/Hxndrik/pgquery/issues/10)) ([237d202](https://github.com/Hxndrik/pgquery/commit/237d2021c8a524c8703581b6b32bbcb8be56ddaf))

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
