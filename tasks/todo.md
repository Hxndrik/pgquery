# pgquery: growth & makeover

Decisions: keep the name **pgquery**, domain **pgquery.dev**. Design direction **B, "Operator's Manual"**, modernized for the app. Public demo on a read-only DB. GoatCounter. New features: schema plate export and an EXPLAIN plan viewer.

## Phase 0: infra & safety
- [x] Site URL from `VITE_SITE_URL` (canonical, og, sitemap, robots, llms.txt); dead `pgquery.io` references removed
- [x] Default port 54280 (`PORT` overrides); Dockerfile build args for site URL / GoatCounter
- [x] `DEMO_DATABASE_URL` (admin URL): the proxy seeds `proxy/demo/seed.sql` on startup and every `DEMO_RESET_INTERVAL` (24h), sets a random password on the SELECT-only `demo` role and serves only that role; the browser sees a placeholder
- [x] Private/loopback targets blocked automatically when a demo is configured (`ALLOW_PRIVATE_HOSTS=true` opts out); checked on the resolved IP; unit tests
- [x] Verified locally: seed on boot, resets, writes / temp tables / `SET read_only off` refused, self-host mode still reaches localhost
- [x] CI (build, go vet/test) and GHCR multi-arch publish workflows. Lint runs but does not block yet (pre-existing errors)

## Phase 1–3: design & app
- [x] Tokens: paper/ink light, ink dark, blue ink, highlighter, dither utilities; self-hosted fonts
- [x] Tuple + pixel icons from one source (`frontend/src/brand/pixels.ts`)
- [x] App restyle: header, sidebar (pixel icons, highlighter selection), primitives, Monaco themes
- [x] Welcome screen with one-click demo; `/app/?demo` deep link
- [x] Landing + 8 guides + 404 as prerendered static HTML with JSON-LD; Go server serves them with real 404s

## Phase 4: features
- [x] EXPLAIN / EXPLAIN ANALYZE plan viewer (asks before analyzing writes)
- [x] Schema plate export (SVG / 2× PNG); masonry layout fixes overlapping tables

## Phase 5: repo
- [x] README, CONTRIBUTING, SECURITY, CHANGELOG, issue templates
- [x] Assets: banner.svg (all pixels, pixel wordmark), favicon, og-image, social preview, touch icon, screenshots (`scripts/assets/build.ts`)

## Review
- Verified: frontend build, go vet/test, proxy routes (/, /app SPA, guides with redirects, 404), demo queries through the placeholder, writes rejected, private hosts blocked, JSON-LD parses on every page, screenshots checked in light/dark/mobile, plate export downloaded and inspected, plan parser checked against real ANALYZE output.
- Not verified here: the Docker image build (no Docker daemon in the sandbox; CI builds it); the real demo DB at the user's host (port blocked from the sandbox, so the seed was tested on a local Postgres 16).
- Follow-ups: fix the pre-existing react-hooks lint errors and make lint blocking; consider edge routing in the schema map (lines cross tables).
