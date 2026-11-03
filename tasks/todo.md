# Roadmap

## Done in 1.0
- [x] Static website and guide pages with structured data, sitemap, robots.txt and llms.txt
- [x] New design ("Operator's Manual"): light and dark themes, pixel icons, Tuple the elephant
- [x] EXPLAIN / EXPLAIN ANALYZE plan viewer
- [x] Schema plate export (SVG / PNG) and a non-overlapping schema layout
- [x] Self-seeding, read-only demo database with daily reset
- [x] Private and local addresses blocked on public (demo) instances
- [x] CI, multi-arch Docker images on GHCR, automated releases

## Next
- [ ] Fix the existing `react-hooks/set-state-in-effect` lint findings, then make lint a required CI check
- [ ] Schema map: route foreign-key lines around tables instead of through them
- [ ] Autocomplete: show each column once with its table, instead of repeating `id` per table
- [ ] Hide Add / Drop actions when the connection is read-only (the demo)
- [ ] More advisor checks (ideas welcome in issues)
