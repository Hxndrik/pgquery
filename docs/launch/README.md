# pgquery launch kit

Everything for launching pgquery. Copy each block as is or put it in your own words; the facts are checked against the code. Posts are written in your voice (first person), because every one of these venues expects the author to post and answer.

## Before you post

- [ ] pgquery.dev serves the new build; https://pgquery.dev/app/?demo opens the demo and a query runs
- [ ] GHCR package is public, so `docker run ghcr.io/hxndrik/pgquery` works without logging in
- [ ] GitHub description, topics and social preview are set; v1.0.0 release is published
- [ ] Google Search Console and Bing Webmaster Tools have the sitemap
- [ ] GoatCounter is counting, so you can see which post brought people
- [ ] You have 3–4 free hours after each post to answer comments

## Order

| When | What |
|---|---|
| Day 1 (Tue–Thu), 8–10am US Eastern | Show HN. Post, add the first comment right away, then answer every comment for the next few hours. |
| Day 2 | r/selfhosted |
| Day 3 | r/PostgreSQL |
| Next Saturday | r/webdev Showoff Saturday (only allowed on Saturdays) |
| Same week | X / Bluesky thread with the demo video; AlternativeTo listing |
| Week 2 | awesome-postgres pull request; optional Product Hunt |
| When eligible | awesome-selfhosted (they require the first release to be older than 4 months) |

## Ground rules

- Never ask friends to upvote or post the link in chats asking for votes. HN and Reddit detect voting rings and bury or ban the post.
- Say you're the author. Every venue here expects it.
- Don't paste the same text everywhere; each block below is written for its venue.
- Answer criticism plainly and thank people for bug reports. Fix quick ones the same day and say so in the thread.
- Don't repost the same thing on HN for a while if it sinks. One repost later is fine if it got no attention at all.

## Show HN

Where: <https://news.ycombinator.com/submit>

Submit the URL, not text. Then immediately add the first comment below. Titles must be plain: no superlatives, no emoji.

**Title**

```text
Show HN: pgquery – a Postgres GUI in your browser, in one Docker container
```

**URL**

```text
https://pgquery.dev
```

**First comment**

```text
Hi HN, I built pgquery, a free, MIT-licensed Postgres GUI that runs in the browser.

I wanted the database screens I like in Supabase Studio (table editor, RLS policies, roles, advisors) for any Postgres, without running a whole platform and without installing a desktop app on every machine I use. So it's one container:

  docker run -p 54280:54280 ghcr.io/hxndrik/pgquery

How it works: a React app plus a small Go proxy that turns HTTP requests into Postgres connections. The proxy keeps no state; saved connections, tabs and history live in your browser's localStorage. Schema changes made through forms (CREATE, ALTER, GRANT, CREATE POLICY) are shown as SQL first and you run them yourself.

What's in it: SQL editor with schema-aware autocomplete, a table editor (JSONB too), an ER diagram you can export as an SVG/PNG "plate", RLS policies, roles and grants, indexes, a pg_stat_statements view, performance and security advisors, and an EXPLAIN / EXPLAIN ANALYZE viewer that draws the plan as a tree and highlights the slowest node.

There's a read-only demo database (a small record store, reset daily): https://pgquery.dev/app/?demo

Limits, honestly: there's no built-in login, so on a shared server put it behind a VPN or an auth proxy. No SSH tunnels, Postgres only, and pgAdmin still does more admin work (backup/restore, a PL/pgSQL debugger). I wrote up where it wins and loses against pgAdmin, CloudBeaver, Adminer and Supabase Studio here: https://pgquery.dev/postgres-client-comparison/

I'd love feedback on the plan viewer and on which advisor checks you'd want next. Source: https://github.com/Hxndrik/pgquery
```

## r/selfhosted

Where: <https://www.reddit.com/r/selfhosted/submit>

Read the sidebar rules first; pick the release/announcement flair they use. Attach demo.mp4 or post as a text post with the link. Stay and answer.

**Title**

```text
pgquery: a Postgres GUI in a single container (SQL editor, ER diagram, RLS policies, EXPLAIN viewer). MIT, no account
```

**Body**

```text
I've been building a browser-based Postgres GUI and just released v1.1. It's one container, about as light as these things get:

    docker run -p 54280:54280 ghcr.io/hxndrik/pgquery

Or compose:

    services:
      pgquery:
        image: ghcr.io/hxndrik/pgquery
        ports:
          - "54280:54280"
        restart: unless-stopped

What you get: SQL editor with autocomplete, table editor (JSONB too), ER diagram with SVG/PNG export, roles and grants, Row Level Security policies, indexes, extensions, a pg_stat_statements view, performance and security advisors, and an EXPLAIN plan viewer. It can also browse S3-compatible buckets.

Self-hosting details:
- amd64 and arm64 images, so a Pi works
- stateless: connections and history stay in your browser, nothing on disk in the container
- no telemetry in the image
- no built-in auth, so put it behind your VPN, Authelia, oauth2-proxy or Cloudflare Access like other admin tools
- no SSH tunnels yet; run it next to the database instead

Read-only demo (sample record store): https://pgquery.dev/app/?demo
Source (MIT): https://github.com/Hxndrik/pgquery

Happy to hear what's missing for your setup.
```

## r/PostgreSQL

Where: <https://www.reddit.com/r/PostgreSQL/submit>

Lead with the Postgres-specific parts. Attach screenshot-plan.png.

**Title**

```text
I built a free Postgres GUI with an EXPLAIN ANALYZE tree view, RLS policy editor and advisors
```

**Body**

```text
pgquery is an open-source (MIT) Postgres GUI that runs in the browser. A few parts I think this sub might care about:

- EXPLAIN / EXPLAIN ANALYZE drawn as a tree: each node's own time and share of the total, the heaviest node highlighted, and a warning where estimated vs actual rows are off by 10x or more. It asks before analyzing an INSERT/UPDATE/DELETE, since ANALYZE executes it.
- Row Level Security: see which tables have RLS on, the policies on each (command, roles, USING / WITH CHECK), and create or drop them. The SQL is shown before it runs.
- Advisors: cache hit ratio, unused indexes, table bloat, sequential scan hot spots, connection use; plus a security check for tables without RLS, superuser roles, public schema grants, SSL and password hashing.
- pg_stat_statements sorted by total time, mean time or calls.
- ER diagram from foreign keys, exportable as SVG/PNG.

Everything is plain pg_catalog queries and generated DDL behind a small stateless Go proxy, so it works with RDS, Supabase, Neon or your own server.

Read-only demo: https://pgquery.dev/app/?demo
Source: https://github.com/Hxndrik/pgquery

There's also an honest comparison with pgAdmin, CloudBeaver, Adminer and Supabase Studio (including where pgquery loses): https://pgquery.dev/postgres-client-comparison/

Which advisor checks would you add? I'm collecting ideas.
```

## r/webdev — Showoff Saturday

Where: <https://www.reddit.com/r/webdev/submit>

Only on Saturdays, with the Showoff Saturday flair. This crowd likes the build details.

**Title**

```text
[Showoff Saturday] pgquery: a Postgres GUI in the browser, with a site that's prerendered from a Vite plugin
```

**Body**

```text
pgquery is an open-source Postgres GUI: React 19 + Monaco for the app, a small Go proxy for the database side, one Docker image.

A few build details that were fun:
- The marketing site and guide pages are plain HTML generated by a small Vite plugin at build time from TypeScript templates, with JSON-LD, sitemap and llms.txt. No SSR framework.
- The mascot and icons are pixel art stored as character grids in one TS file; the app, the site, the favicon, the README banner and the share image are all rendered from it.
- The EXPLAIN viewer parses Postgres's JSON plan into a flat tree with per-node self time.

Demo (read-only DB): https://pgquery.dev/app/?demo
Code: https://github.com/Hxndrik/pgquery

Feedback on the design very welcome.
```

## X / Bluesky thread

Attach demo.mp4 to post 1, screenshot-plan.png to post 3, schema-plate.png to post 4.

**1/6 (with demo.mp4)**

```text
I made pgquery: a free Postgres GUI that runs in your browser and ships as one Docker container.

SQL editor, tables, ER diagram, RLS policies, roles, indexes, advisors. No account.

Try the read-only demo → pgquery.dev
```

**2/6**

```text
Self-host it in one line:

docker run -p 54280:54280 ghcr.io/hxndrik/pgquery

The server is a small stateless Go proxy. Your connections and history stay in your browser.
```

**3/6 (with screenshot-plan.png)**

```text
EXPLAIN ANALYZE as a tree: each node's share of the time, the heaviest one highlighted, and a warning when row estimates are off by 10×.
```

**4/6 (with schema-plate.png)**

```text
Export your schema as a printable "plate": an ER diagram with a title block, as SVG or PNG. Drop it into a design doc or pin it to the wall.
```

**5/6**

```text
I also wrote an honest comparison with pgAdmin, CloudBeaver, Adminer and Supabase Studio. Including the parts where pgquery loses (no login, no SSH tunnels, Postgres only).

pgquery.dev/postgres-client-comparison
```

**6/6**

```text
MIT licensed. Code, issues and ideas welcome: github.com/Hxndrik/pgquery
```

## awesome-postgres (pull request)

Where: <https://github.com/dhamaniasad/awesome-postgres>

Add one line to the GUI section, matching the list's existing format and alphabetical order; check their CONTRIBUTING first. PR title: "Add pgquery".

**List entry**

```text
* [pgquery](https://github.com/Hxndrik/pgquery) - Browser-based PostgreSQL GUI shipped as one Docker container: SQL editor, table editor, ER diagram, RLS policies, EXPLAIN viewer and performance/security advisors.
```

**PR description**

```text
Adds pgquery, an MIT-licensed, browser-based PostgreSQL GUI (single Docker container) to the GUI section. Demo: https://pgquery.dev/app/?demo
```

## awesome-selfhosted (pull request to awesome-selfhosted-data)

Where: <https://github.com/awesome-selfhosted/awesome-selfhosted-data>

Their rules: the project must have been first released more than 4 months ago, be actively maintained, and descriptions must not say "self-hosted" or "open-source" (it's implied) and stay under 250 characters. Add a file software/pgquery.yml. Check their current schema and tag names before submitting.

**software/pgquery.yml**

```text
name: pgquery
website_url: https://pgquery.dev
source_code_url: https://github.com/Hxndrik/pgquery
description: Browser-based PostgreSQL GUI with SQL editor, table editor, ER diagram, Row Level Security policies, query plan viewer and performance/security advisors.
licenses:
  - MIT
platforms:
  - Docker
  - Go
tags:
  - Database Management
demo_url: https://pgquery.dev/app/?demo
```

## AlternativeTo listing

Where: <https://alternativeto.net/software/new/>

Add the app, then mark it as an alternative on the pgAdmin, DBeaver, Adminer and Supabase pages.

**Name**

```text
pgquery
```

**Short description**

```text
Free, open-source Postgres GUI in your browser, shipped as one Docker container.
```

**Description**

```text
pgquery is a PostgreSQL GUI that runs in the browser. It includes a SQL editor with schema-aware autocomplete, a table editor, an ER diagram with SVG/PNG export, Row Level Security policies, roles and grants, indexes, a pg_stat_statements view, performance and security advisors, and an EXPLAIN plan viewer. Self-host it with one docker run; the server is a stateless Go proxy and connections stay in your browser. MIT licensed, no account.
```

**Tags**

```text
PostgreSQL, Database GUI, SQL Editor, Database Management, Self-Hosted, Web-based, Docker, Open Source
```

**Alternative to**

```text
pgAdmin, DBeaver, TablePlus, Adminer, Beekeeper Studio, DataGrip, Supabase Studio
```

## Product Hunt (optional)

Where: <https://www.producthunt.com/posts/new>

Optional; works best with a few people ready to try it on launch day. Launch at 00:01 Pacific. Gallery: og-image.png, screenshot-editor.png, screenshot-plan.png, schema-plate.png, demo.mp4.

**Tagline (≤ 60 chars)**

```text
A free Postgres studio in one Docker container
```

**Description**

```text
pgquery is a browser-based PostgreSQL GUI: SQL editor, table editor, ER diagram, RLS policies, EXPLAIN plan viewer and performance/security advisors. One docker run, no account, MIT licensed.
```

**Maker comment**

```text
Hey Product Hunt! I built pgquery because I wanted Supabase-style database screens for any Postgres, without installing a desktop app or running a whole platform. It's one container; your connections stay in your browser. Try the read-only demo and tell me what you'd want next.
```

## Media (this folder and docs/assets)

- `demo.mp4`: 21 s real recording: connect with a string, open a table, edit a value, run SQL, EXPLAIN ANALYZE. For X, Bluesky, Reddit, Product Hunt.
- `demo.gif`: Same recording as a GIF, for the README and places that don't take video.
- `og-image.png`: 1200×630 share card (used automatically when the link is shared).
- `social-preview.png`: 1280×640, for GitHub Settings → Social preview.
- `screenshot-editor.png`: SQL editor with results.
- `screenshot-plan.png`: EXPLAIN ANALYZE tree.
- `schema-plate.png`: Exported schema plate.
- `screenshot-dark.png`: Dark mode.
