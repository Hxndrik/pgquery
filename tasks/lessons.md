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
