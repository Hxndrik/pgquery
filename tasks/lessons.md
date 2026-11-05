# Lessons

Pitfalls found while building pgquery, written down so they don't repeat.

## The app is a tool first
Brand flair (pixel art, dither, the black band) belongs on the website, share cards and README. Inside the app, readability and density come first; keep the identity to type, contrast and one motif.

## Check facts before writing copy
Every feature claim on the site and in the README is checked against the code (for example, the Security Advisor flags tables *without RLS*; it does not inspect "exposed schemas"). Never invent stats such as stars or user counts.

## Default views must land on real data
The Tables view once opened the alphabetically first schema (`extensions`), whose first entry (`pg_stat_statements`) errors on servers that don't preload the library. Defaults now prefer `public` and remember the last choice, and the demo seed only installs extensions that work on that server.

## No real infrastructure in code or tests
Use documentation values in examples and tests: `db.example.com`, `203.0.113.0/24` for public IPs, `user:pass`. Never a real host, IP or credential.

## Hand-off steps need exact locations
When a step has to be done by hand (GitHub settings, a deploy setting), give the full URL and the exact button path, e.g. https://github.com/Hxndrik/pgquery/settings → Social preview → Edit → Upload an image.

## Monaco needs SQL-specific token names
The SQL tokenizer emits `predefined.sql` and `operator.sql` (JOIN, AND, IN …); theme rules for plain `predefined`/`operator` don't apply to them.

## Values travel as Postgres text, never as JS numbers
JSON numbers become doubles in the browser: an int8 primary key past 2^53 once sent edits and deletes to a different row, and numeric `Infinity` showed as 0. Result grids and the table editor use text mode (`executeQuery(…, { text: true })`), which returns each value as Postgres prints it, and edits send strings back as text parameters. Only catalog pages use typed results. `proxy/demo/seed.sql` has a `type_edge_cases` table, and `TestTypeEdgeCasesRoundTrip` checks every value survives a write-back.

## Hosted-app claims come from facts.ts
pgquery.dev is the main way in, but its deployment settings are not in this repo. Say what the code guarantees (stateless proxy, no logging, private hosts refused when a demo is configured) and never quote hosted limits as numbers. `DATA_NOTE`, `HOSTED_LIMITS` and `PERSONAL_NOTE` in `frontend/site/facts.ts` feed the site and llms.txt; README.md, SECURITY.md and docs/launch repeat them by hand, so change them together.

## Serving user-controlled bytes from the app's origin
The S3 download route streams whatever a bucket holds from the same origin as the app, which keeps every saved connection in localStorage. A crafted link with an HTML object and `inline=1` would have run as a page there. Everything except a PDF is now an attachment under `Content-Security-Policy: sandbox`, and links are sealed tokens. Keep that in mind for any new route that proxies content.

## A new public route needs the private-address guard
The S3 handlers were plain functions, so they skipped the private-host check that `cfg.connect` applies to Postgres. Anything that dials a client-supplied address goes through `cfg` and `guardedDial`.

## Check phone widths, not just desktop
Once the hero headline got longer, a heading overflowed at 360 px and the site header spent two rows on navigation. Audit the rendered pages at 360 and 390 px (horizontal overflow, elements past the viewport, tap targets under 32 px) before shipping copy changes, and keep each headline sentence on its own line so it can't wrap mid-phrase. In the app, `md:` is the line between a drawer and a fixed sidebar; panes that sit side by side (the SQL editor's saved queries, the table explorer's lists and grid) still need a stacked layout on phones.
