# pgquery — growth & makeover plan

Goal: give pgquery a distinctive identity, fix discoverability, and prepare a launch.

## Phase 0 — Fixes that don't depend on the design
- [ ] Make site URL configurable (`VITE_SITE_URL`) for canonical / og / sitemap / robots; stop pointing at the dead `pgquery.io`
- [ ] Generate `robots.txt` + `sitemap.xml` at build time from the same URL
- [ ] GitHub Actions workflow: build + push Docker image to GHCR on tag / main
- [ ] `docker run ghcr.io/hxndrik/pgquery` one-liner in README

## Phase 1 — Design direction (user picks)
- [ ] 3 directions on a design canvas: landing, app UI, share card each
  - A. Insert Coin — pixel arcade, mascot "Tuple" the elephant
  - B. Operator's Manual — printed technical manual, 1-bit dithered art
  - C. Schema Transit — schema as a subway map, wayfinding signage
- [ ] User picks (or mixes)

## Phase 2 — Build the chosen direction
- [ ] Design tokens (index.css + tailwind) for app + landing
- [ ] New landing page (pre-rendered HTML for SEO)
- [ ] Restyle app chrome (sidebar, tabs, editor theme, tables, modals)
- [ ] OG / share image 1200×630 + favicon + apple-touch icon
- [ ] Pixel-art SVG set: banner, mascot, feature icons
- [ ] Signature shareable feature (direction-specific viral hook)

## Phase 3 — Repo makeover
- [ ] README: banner, GIF, pitch, one-command run, comparison table, features with icons
- [ ] CONTRIBUTING.md, issue templates, good-first-issue labels
- [ ] Repo topics + description (user does this in GitHub settings)

## Phase 4 — Launch (user)
- [ ] Own domain live, set `VITE_SITE_URL`, submit to Google Search Console
- [ ] Analytics (Plausible / Umami / GoatCounter)
- [ ] Show HN → r/selfhosted → r/PostgreSQL → awesome-postgres / awesome-selfhosted PRs
- [ ] Long-tail landing pages: RLS editor, ER diagram, Supabase Studio alternative, pg_stat_statements viewer

## Review
_(filled in at the end)_
