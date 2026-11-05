# pgquery launch kit

Everything for launching pgquery. Copy each block as is or put it in your own words; the facts are checked against the code. Posts are written in your voice (first person), because every one of these venues expects the author to post and answer.

## Before you post

- [ ] pgquery.dev serves the new build; https://pgquery.dev/app/?demo opens the demo and a query runs
- [ ] GHCR package is public, so `docker run ghcr.io/hxndrik/pgquery` works without logging in
- [ ] GitHub About text, website and topics are set (see [GitHub repository settings](#github-repository-settings)), social preview uploaded, latest release published
- [ ] https://pgquery.dev/app/ connects to a real database on the public internet (e.g. a free Supabase or Neon project)
- [ ] `DEMO_S3_*` is set on the server and https://pgquery.dev/app/?demo=s3 opens the sample bucket, with video and CSV previews working
- [ ] Google Search Console and Bing Webmaster Tools have the sitemap
- [ ] GoatCounter is counting, so you can see which post brought people
- [ ] You have 3–4 free hours after each post to answer comments

## GitHub repository settings

Open https://github.com/Hxndrik/pgquery, click the gear icon next to **About** on the right, and paste these.

**Description**

```text
Browser client for Postgres and S3. Connect your live database or bucket at pgquery.dev; connections stay in localStorage. Free, MIT, optionally self-hosted as one Docker container.
```

**Website**

```text
https://pgquery.dev
```

**Topics**

```text
postgres postgresql database-gui sql-editor sql-client postgresql-client s3 s3-browser object-storage web-based browser self-hosted docker row-level-security explain-analyze er-diagram pgadmin-alternative
```

Then upload `docs/assets/social-preview.png` (regenerated with the new "in your browser" text): https://github.com/Hxndrik/pgquery/settings → Social preview → Edit → Upload an image.

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
Show HN: pgquery – query Postgres and browse S3 from a browser tab, nothing to install
```

**URL**

```text
https://pgquery.dev
```

**First comment**

```text
Hi HN, I built pgquery, a free, MIT-licensed Postgres client that runs in the browser. You open https://pgquery.dev/app/, paste a connection string and work on your live database. Nothing to install, no account.

I wanted the database screens I like in Supabase Studio (table editor, RLS policies, roles, advisors) for any Postgres, without running a whole platform and without installing a desktop app on every machine I use. It started as a tool for myself; I'm publishing it to see if others find it useful.

How it works: a React app plus a small Go proxy that turns HTTP requests into Postgres connections. Saved connections, tabs and history live in your browser's localStorage; the proxy is stateless and doesn't log or store queries or connection strings. Schema changes made through forms (CREATE, ALTER, GRANT, CREATE POLICY) are shown as SQL first and you run them yourself.

What's in it: SQL editor with schema-aware autocomplete, a table editor (JSONB too), an ER diagram you can export as an SVG/PNG "plate", RLS policies, roles and grants, indexes, a pg_stat_statements view, performance and security advisors, an EXPLAIN / EXPLAIN ANALYZE viewer that draws the plan as a tree and highlights the slowest node, and a small S3 bucket browser (previews, upload, delete; one bucket per connection, no multipart upload).

No database handy? There's a read-only sample (a small record store, reset daily): https://pgquery.dev/app/?demo, and a read-only sample bucket: https://pgquery.dev/app/?demo=s3

The hosted app only connects to public addresses. If your database is in a private network, or you'd rather queries not pass through my server, it's one container:

  docker run -p 54280:54280 ghcr.io/hxndrik/pgquery

Limits, honestly: no SSH tunnels, Postgres only, and pgAdmin still does more admin work (backup/restore, a PL/pgSQL debugger). A self-hosted copy has no login of its own, so put it behind a VPN or an auth proxy. I wrote up where it wins and loses against pgweb, DbGate, pgAdmin, CloudBeaver, Adminer and Supabase Studio here: https://pgquery.dev/postgres-client-comparison/

It's free and will stay free. I'd love feedback on the plan viewer, which advisor checks you'd want next, and whether the hosted limits get in your way. Source and issues: https://github.com/Hxndrik/pgquery
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

If you just want to try it first, the same app is hosted at https://pgquery.dev/app/ (public databases only; connections stay in your browser). Read-only sample database: https://pgquery.dev/app/?demo
Source (MIT): https://github.com/Hxndrik/pgquery

It's a personal project, free and staying that way. Happy to hear what's missing for your setup.
```

## r/PostgreSQL

Where: <https://www.reddit.com/r/PostgreSQL/submit>

Lead with the Postgres-specific parts. Attach screenshot-plan.png.

**Title**

```text
I built a free Postgres client for the browser with an EXPLAIN ANALYZE tree view, RLS policy editor and advisors
```

**Body**

```text
pgquery is an open-source (MIT) Postgres client that runs in the browser: open https://pgquery.dev/app/, paste a connection string, done. Connections stay in your browser's localStorage. A few parts I think this sub might care about:

- EXPLAIN / EXPLAIN ANALYZE drawn as a tree: each node's own time and share of the total, the heaviest node highlighted, and a warning where estimated vs actual rows are off by 10x or more. It asks before analyzing an INSERT/UPDATE/DELETE, since ANALYZE executes it.
- Row Level Security: see which tables have RLS on, the policies on each (command, roles, USING / WITH CHECK), and create or drop them. The SQL is shown before it runs.
- Advisors: cache hit ratio, unused indexes, table bloat, sequential scan hot spots, connection use; plus a security check for tables without RLS, superuser roles, public schema grants, SSL and password hashing.
- pg_stat_statements sorted by total time, mean time or calls.
- ER diagram from foreign keys, exportable as SVG/PNG.

Everything is plain pg_catalog queries and generated DDL behind a small stateless Go proxy, so it works with RDS, Supabase, Neon or your own server. For databases in a private network, self-host it as one container.

Read-only sample database: https://pgquery.dev/app/?demo
Source: https://github.com/Hxndrik/pgquery

There's also an honest comparison with pgweb, DbGate, pgAdmin, CloudBeaver, Adminer and Supabase Studio (including where pgquery loses): https://pgquery.dev/postgres-client-comparison/

Which advisor checks would you add? I'm collecting ideas.
```

## r/webdev — Showoff Saturday

Where: <https://www.reddit.com/r/webdev/submit>

Only on Saturdays, with the Showoff Saturday flair. This crowd likes the build details.

**Title**

```text
[Showoff Saturday] pgquery: a Postgres client in the browser, everything kept in localStorage
```

**Body**

```text
pgquery is an open-source Postgres client you use at https://pgquery.dev/app/: React 19 + Monaco for the app, a small stateless Go proxy for the database side. Connections, tabs and history live in localStorage, so there's no account and no backend database. Self-hosting is one Docker image.

A few build details that were fun:
- The marketing site and guide pages are plain HTML generated by a small Vite plugin at build time from TypeScript templates, with JSON-LD, sitemap and llms.txt. No SSR framework.
- The mascot and icons are pixel art stored as character grids in one TS file; the app, the site, the favicon, the README banner and the share image are all rendered from it.
- The EXPLAIN viewer parses Postgres's JSON plan into a flat tree with per-node self time.

App: https://pgquery.dev/app/ (or a read-only sample DB: https://pgquery.dev/app/?demo)
Code: https://github.com/Hxndrik/pgquery

It's a side project I use myself. Feedback on the design very welcome.
```

## X / Bluesky thread

Attach demo.mp4 to post 1, screenshot-plan.png to post 3, schema-plate.png to post 4.

**1/6 (with demo.mp4)**

```text
I made pgquery: a free Postgres client in your browser. Paste a connection string, work on your live database.

SQL editor, tables, ER diagram, RLS policies, roles, indexes, advisors. No install, no account.

→ pgquery.dev
```

**2/6**

```text
Your connections and history stay in your browser's localStorage. The server is a small stateless Go proxy.

Database in a private network? Self-host it in one line:

docker run -p 54280:54280 ghcr.io/hxndrik/pgquery
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
I also wrote an honest comparison with pgweb, DbGate, pgAdmin, CloudBeaver, Adminer and Supabase Studio. Including the parts where pgquery loses (no SSH tunnels, Postgres only, young).

pgquery.dev/postgres-client-comparison
```

**6/6**

```text
A personal project, MIT licensed and free. Issues and ideas welcome: github.com/Hxndrik/pgquery
```

## awesome-postgres (pull request)

Where: <https://github.com/dhamaniasad/awesome-postgres>

Add one line to the GUI section, matching the list's existing format and alphabetical order; check their CONTRIBUTING first. PR title: "Add pgquery".

**List entry**

```text
* [pgquery](https://github.com/Hxndrik/pgquery) - Browser-based PostgreSQL client, hosted or self-hosted in one Docker container: SQL editor, table editor, ER diagram, RLS policies, EXPLAIN viewer and performance/security advisors.
```

**PR description**

```text
Adds pgquery, an MIT-licensed, browser-based PostgreSQL client (hosted at https://pgquery.dev, or a single Docker container) to the GUI section. Sample database: https://pgquery.dev/app/?demo
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
Free, open-source Postgres and S3 client in your browser. Connections stay in localStorage.
```

**Description**

```text
pgquery is a browser client for PostgreSQL and S3. It includes a SQL editor with schema-aware autocomplete, a table editor, an ER diagram with SVG/PNG export, Row Level Security policies, roles and grants, indexes, a pg_stat_statements view, performance and security advisors, an EXPLAIN plan viewer and an S3 bucket browser. Use it at pgquery.dev with nothing to install, or self-host it with one docker run. The server is a stateless Go proxy and connections stay in your browser. MIT licensed, no account.
```

**Tags**

```text
PostgreSQL, Database GUI, SQL Editor, Database Management, Web-based, Self-Hosted, Docker, Open Source
```

**Alternative to**

```text
pgweb, DbGate, pgAdmin, DBeaver, TablePlus, Adminer, Beekeeper Studio, DataGrip, Supabase Studio
```

## Product Hunt (optional)

Where: <https://www.producthunt.com/posts/new>

Optional; works best with a few people ready to try it on launch day. Launch at 00:01 Pacific. Gallery: og-image.png, screenshot-editor.png, screenshot-plan.png, schema-plate.png, demo.mp4.

**Tagline (≤ 60 chars)**

```text
Query Postgres, browse S3. Nothing to install
```

**Description**

```text
pgquery is a browser client for PostgreSQL and S3: paste a connection string and get a SQL editor, table editor, ER diagram, RLS policies, EXPLAIN plan viewer and performance/security advisors, or add a bucket and browse it. Connections stay in your browser, no account, MIT licensed. Self-host it as one container if you prefer.
```

**Maker comment**

```text
Hey Product Hunt! I built pgquery because I wanted Supabase-style database screens for any Postgres, without installing a desktop app or running a whole platform. Open it, paste a connection string, and your connections stay in your browser. It's a personal project, free and staying free. Try it (or the read-only sample database) and tell me what you'd want next.
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
