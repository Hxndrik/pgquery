# Roadmap

## Done in 1.0
- [x] Static website and guide pages with structured data, sitemap, robots.txt and llms.txt
- [x] New design ("Operator's Manual"): light and dark themes, pixel icons, Tuple the elephant
- [x] EXPLAIN / EXPLAIN ANALYZE plan viewer
- [x] Schema plate export (SVG / PNG) and a non-overlapping schema layout
- [x] Self-seeding, read-only demo database with daily reset
- [x] Private and local addresses blocked on public (demo) instances
- [x] CI, multi-arch Docker images on GHCR, automated releases
- [x] Honest comparison pages (browser clients, pgAdmin, DBeaver, Supabase Studio) and connection guides (Supabase, Neon, RDS, local / Docker)
- [x] One-accent app UI (yellow), semantic tokens only; Monaco and exports read brand/colors.ts
- [x] Home: video hero, comparison right below
- [x] pgweb and DbGate in the comparisons; warning when a connection isn't encrypted

## Next
- [ ] Fix the existing `react-hooks/set-state-in-effect` lint findings, then make lint a required CI check
- [ ] Schema map: route foreign-key lines around tables instead of through them
- [ ] Autocomplete: show each column once with its table, instead of repeating `id` per table; skip extension views like pg_stat_statements
- [ ] Accept libpq-style key=value strings (`host=… dbname=…`), not only Npgsql-style
- [ ] Hide Add / Drop actions when the connection is read-only (the demo); edits already explain the read-only error
- [ ] More advisor checks (ideas welcome in issues)
