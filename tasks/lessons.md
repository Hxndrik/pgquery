# Lessons

## Design for the product's audience, not for novelty
- The user rejected gimmicky directions (arcade game, subway map) with "we are making a database tool popular, not a game".
- Rule: creative flair goes in the brand surfaces (landing, share card, README art). The app itself must look like a serious, modern tool first.
- Rule: when a direction has "period" flavour (old manuals, retro), keep the identity in type, contrast and one motif (dither, the black band) and drop the literal props (ruled paper, binder tabs, serif UI text).

## Check facts before writing marketing copy
- Every feature claim on the site/README was checked against the code (e.g. the Security Advisor flags tables without RLS, not "tables in exposed schemas").
- Never invent stats (stars, users) in mockups or copy.

## Give the user exact URLs for manual steps
- The user asked: "from now on give me urls and exactly where I need to do what".
- Rule: every manual step names the full URL and the exact button/field path, e.g. https://github.com/Hxndrik/pgquery/settings → "Social preview" → Edit → Upload.

## Default views must land on user data
- Tables opened the alphabetically first schema (`extensions`) whose first view errored on servers without pg_stat_statements preloaded.
- Rule: default selections prefer `public` (or the first schema with tables) and remember the user's last choice; seed data must only install extensions that actually work on that server.
