<p align="center">
  <a href="https://pgquery.dev"><img src="docs/assets/banner.svg" alt="pgquery, with Tuple the pixel elephant" width="680"></a>
</p>

<p align="center">
  <b>Query Postgres. Browse S3. Install nothing.</b><br>
  A browser client for your remote data: connect your live database or bucket, with no account. What you save stays in your browser.
</p>

<p align="center">
  <a href="https://pgquery.dev/app/"><b>Open pgquery</b></a> ·
  <a href="https://pgquery.dev/app/?demo">Sample database</a> ·
  <a href="https://pgquery.dev/app/?demo=s3">Sample bucket</a> ·
  <a href="https://pgquery.dev">Website</a> ·
  <a href="#features">Features</a> ·
  <a href="#self-hosting-optional">Self-hosting</a> ·
  <a href="https://pgquery.dev/postgres-client-comparison/">Comparison</a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-16181d?style=flat-square"></a>
  <a href="https://github.com/Hxndrik/pgquery/pkgs/container/pgquery"><img alt="Docker image" src="https://img.shields.io/badge/ghcr.io-hxndrik%2Fpgquery-2340d9?style=flat-square&logo=docker&logoColor=white"></a>
  <a href="https://github.com/Hxndrik/pgquery/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Hxndrik/pgquery/ci.yml?branch=main&style=flat-square&label=ci"></a>
  <img alt="amd64 and arm64" src="https://img.shields.io/badge/arch-amd64%20%7C%20arm64-16181d?style=flat-square">
</p>

<p align="center">
  <img src="docs/launch/demo.gif" alt="pgquery walkthrough: open the demo, run a JOIN query, Explain analyze, schema map" width="900">
</p>

## Get started

1. Open **[pgquery.dev/app](https://pgquery.dev/app/)**.
2. Paste a connection string. Both `postgres://user:pass@host:5432/db` URIs and Npgsql / ADO.NET style key=value strings (`Host=…;Database=…`) work.
3. Query, browse and manage your database.

Want to look around first? The [sample database](https://pgquery.dev/app/?demo) is a small, read-only record store, and the [sample bucket](https://pgquery.dev/app/?demo=s3) is a read-only set of images, a video, CSV and JSON. To browse your own bucket, choose **S3** in the connection dialog ([details below](#s3-buckets)).

The hosted app reaches databases on the public internet: Supabase, Neon, RDS, Cloud SQL, a VPS. For a database in a private network or on localhost, [run your own copy](#self-hosting-optional). There are step-by-step guides for [Supabase](https://pgquery.dev/connect-supabase/), [Neon](https://pgquery.dev/connect-neon/), [Amazon RDS](https://pgquery.dev/connect-aws-rds/) and [local or Docker](https://pgquery.dev/connect-local-postgres/) databases.

## Where your data goes

```
Browser (React app) ──HTTP──▶ pgquery proxy ──Postgres protocol──▶ your database
```

- Saved connections (S3 keys included), tabs, history and saved queries live in your browser's localStorage. There is no account and no server-side storage.
- Each query is sent with its connection string to the proxy, which opens a connection, runs it and returns the rows. S3 requests work the same way, and uploaded or downloaded files pass through without being kept. The proxy is stateless, and its code (it's all in [`proxy/`](proxy)) does not log or store connection strings, keys, queries or files.
- Connections use SSL when the server offers it (`sslmode=prefer`); the app warns when one isn't encrypted. Add `?sslmode=require` to refuse plain connections.
- Schema changes made through forms (CREATE, ALTER, GRANT, CREATE POLICY …) are shown as SQL first, and you run them yourself.
- On pgquery.dev, the proxy is the pgquery.dev server. If queries must not leave your own network, self-host.

## Features

| | |
|---|---|
| <img src="docs/assets/icons/editor.svg" width="16" alt=""> **SQL editor** | Monaco with schema-aware autocomplete, tabs that survive a reload, 500-entry history, saved queries, CSV and JSON export |
| <img src="docs/assets/icons/plan.svg" width="16" alt=""> **EXPLAIN plan viewer** | `EXPLAIN (ANALYZE)` drawn as a tree, with each node's share of the time, the heaviest node highlighted and bad row estimates flagged |
| <img src="docs/assets/icons/table.svg" width="16" alt=""> **Table editor** | Browse, sort, paginate, insert, edit and delete rows. JSONB opens as real JSON |
| <img src="docs/assets/icons/schema.svg" width="16" alt=""> **Schema map** | ER diagram from your foreign keys. Export it as a printable SVG or PNG plate |
| <img src="docs/assets/icons/key.svg" width="16" alt=""> **Policies (RLS)** | Turn Row Level Security on per table and manage its policies |
| <img src="docs/assets/icons/roles.svg" width="16" alt=""> **Roles & grants** | Create roles, set attributes, grant and revoke membership |
| <img src="docs/assets/icons/index.svg" width="16" alt=""> **Indexes** | Usage stats; create btree, hash, gin, gist or brin indexes, concurrently if you like |
| <img src="docs/assets/icons/bolt.svg" width="16" alt=""> **Query performance** | `pg_stat_statements` ranked by total time, mean time or calls |
| <img src="docs/assets/icons/lens.svg" width="16" alt=""> **Performance advisor** | Cache hit ratio, unused indexes, table bloat, sequential scans, connection use |
| <img src="docs/assets/icons/shield.svg" width="16" alt=""> **Security advisor** | Scored audit of RLS coverage, superusers, public schema grants, SSL and password hashing |
| <img src="docs/assets/icons/fn.svg" width="16" alt=""> **Functions, triggers, enums** | List, read, create and drop |
| <img src="docs/assets/icons/plug.svg" width="16" alt=""> **Extensions, publications, FDW** | Install extensions, manage publications, browse foreign servers and tables |
| <img src="docs/assets/icons/gear.svg" width="16" alt=""> **Settings** | Every server setting by category; change session or system values |
| <img src="docs/assets/icons/bucket.svg" width="16" alt=""> **S3 browser** | Folders, paging, previews of images, video, audio, PDF and text, download, upload, new folders and recursive delete in an S3-compatible bucket |

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshot-plan.png" alt="EXPLAIN ANALYZE plan drawn as a tree with timing bars"></td>
    <td width="50%"><img src="docs/assets/schema-plate.png" alt="Schema plate export: ER diagram of the record_store sample with a title block"></td>
  </tr>
  <tr>
    <td><sub><b>FIG. 3</b> Explain analyze: the heaviest node is highlighted.</sub></td>
    <td><sub><b>FIG. 4</b> A schema plate, exported from the schema map.</sub></td>
  </tr>
</table>

## S3 buckets

Next to PostgreSQL, pgquery connects to one S3 bucket at a time: endpoint, access key, secret key, bucket and region. It uses Signature V4 and path-style requests, so it is meant for services such as AWS S3, Cloudflare R2 and MinIO. The automated tests run against an S3 emulator; if a service behaves differently, please open an issue with its name.

What it does: open folders, filter, load more past 1,000 objects, preview (images, video that seeks, audio, PDF, text and code), download, upload, create folders, delete objects or whole folders after a confirmation that counts them, and show the bucket's object count and size.

What it doesn't:

- One bucket per connection; it doesn't list, create or delete buckets.
- Access keys only, no session tokens or IAM roles.
- Uploads are a single request per file, up to `MAX_UPLOAD_MB` (100 by default when self-hosting), with no multipart upload or resume. Files pass through the pgquery server, so use the AWS CLI or rclone for very large ones.
- A delete removes up to 10,000 objects at a time.
- No rename, copy or move, no metadata or tag editing, no versioning, ACLs, bucket policies or lifecycle rules.

Keys are saved in your browser like any other connection and are sent with each request. The hosted app only reaches buckets on the public internet; for storage on localhost or in a private network, [self-host](#self-hosting-optional). The full guide is at [pgquery.dev/s3-bucket-browser](https://pgquery.dev/s3-bucket-browser/).

## How it compares

| | pgquery | pgweb | DbGate | pgAdmin 4 | CloudBeaver | Adminer | Supabase Studio |
|---|---|---|---|---|---|---|---|
| Runs in the browser | yes | yes | yes (also desktop) | yes (server mode) | yes | yes | yes |
| Runs as | hosted app, or one Go container | one Go binary | Node.js server | Python web app | Java web app | one PHP file | part of the Supabase stack |
| Databases | PostgreSQL | PostgreSQL | many | PostgreSQL | many | many | PostgreSQL (Supabase) |
| SSH tunnel | no | yes | yes | yes | yes | no | no |
| RLS editor, advisors | yes | no | not listed | partly | no | no | yes |
| License | MIT | MIT | GPL-3.0 | PostgreSQL License | Apache 2.0 | Apache 2.0 or GPL 2 | Apache 2.0 |

pgweb is a lean, mature query explorer in one binary; DbGate covers many databases with import / export and schema compare; pgAdmin does the most administration (backup and restore, a PL/pgSQL debugger, user accounts). pgquery has no SSH tunnels, and a self-hosted copy has no login of its own. The [full, honest comparison](https://pgquery.dev/postgres-client-comparison/) lists where it wins and where it loses.

## Self-hosting (optional)

Run your own copy when your database is in a private network or on localhost, when you want your own limits, or when queries should stay inside your network. It's one image with a Go binary that serves the app and proxies queries.

```bash
docker run -p 54280:54280 ghcr.io/hxndrik/pgquery
```

Open <http://localhost:54280>. `latest` is the newest release; `main` follows the main branch. Pin a version with e.g. `ghcr.io/hxndrik/pgquery:1.0`.

Or with Docker Compose:

```yaml
services:
  pgquery:
    image: ghcr.io/hxndrik/pgquery
    ports:
      - "54280:54280"
    restart: unless-stopped
```

pgquery has no login of its own. On a shared server, put it behind your VPN or an authenticating reverse proxy (oauth2-proxy, Authelia, Cloudflare Access). More in the [self-hosting guide](https://pgquery.dev/self-hosted-postgres-gui-docker/).

### Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `54280` | HTTP listen port |
| `STATIC_DIR` | `../frontend/dist` | Built frontend (set to `/app/static` in the image) |
| `RATE_LIMIT_RPM` | `600` | Requests per minute per client IP |
| `MAX_QUERY_TIMEOUT` | `30s` | Maximum query time |
| `MAX_ROWS` | `10000` | Maximum rows returned per query |
| `MAX_UPLOAD_MB` | `100` | Largest file the S3 browser uploads |
| `DEMO_DATABASE_URL` | – | For a public demo instance. An admin `postgres://` URL to a **dedicated** database. On startup the app seeds a sample record store ([`proxy/demo/seed.sql`](proxy/demo/seed.sql)) and serves it through a SELECT-only role with a random password. The admin URL never reaches the browser |
| `DEMO_S3_ENDPOINT`, `DEMO_S3_ACCESS_KEY`, `DEMO_S3_SECRET_KEY` | – | For a public demo instance. The endpoint and root keys of an S3 service holding a **dedicated** bucket (`DEMO_S3_BUCKET`, default `pgquery-demo`; `DEMO_S3_REGION`, default `us-east-1`). On startup the app creates the bucket if needed, uploads the sample files embedded in the binary ([`proxy/demo/bucket`](proxy/demo/bucket)) and removes everything else. Visitors reach it read-only through `s3://demo.pgquery`; the keys never reach the browser |
| `DEMO_RESET_INTERVAL` | `24h` | How often the demos are re-seeded; `0` seeds once |
| `ALLOW_PRIVATE_HOSTS` | `false` | With a demo (database or bucket) configured, connections to loopback, private and link-local addresses are refused, for Postgres and S3 alike, so a public instance can't be used to reach your network. `true` allows them anyway. Without a demo nothing is blocked |

Build-time settings for the public website (Docker build args):

| Build arg | Default | Description |
|---|---|---|
| `VITE_SITE_URL` | `https://pgquery.dev` | Canonical URL for pages, sitemap and share images |
| `VITE_GOATCOUNTER_CODE` | – | Optional GoatCounter site code for privacy-friendly page counts |

## A personal project

I built pgquery for my own Postgres work and decided to publish it. It's free and will stay free; I'm not doing this to make money. I'd like to know whether it's useful to others. Expect a few rough edges.

If something breaks, a feature is missing, the hosted limits get in your way, or you'd want more than the free app offers, [open an issue](https://github.com/Hxndrik/pgquery/issues/new/choose). A link and a short description is plenty.

## Development

Requirements: Node 22+, Go 1.26+.

```bash
make dev    # Vite on :28000, proxy on :54280
make build  # frontend/dist and the proxy binary
```

- `frontend/src`: the React app (served at `/app`)
- `frontend/site`: the static website and guides, rendered at build time
- `frontend/src/brand/pixels.ts`: Tuple and the pixel icons; `node scripts/assets/build.ts` regenerates the assets in `docs/assets` and `frontend/public`
- `proxy`: the Go server

See [CONTRIBUTING.md](CONTRIBUTING.md).

## FAQ

**Is it really free?** Yes. MIT licensed, no paid tier, no account. The hosted app is free too.

**Does my data go through your servers?** On pgquery.dev, yes: each query passes through the pgquery.dev proxy on its way to your database. It is stateless and its code doesn't log or store queries or connection strings. When you self-host, queries go from your browser to your container to your database.\n\n**What are the limits on pgquery.dev?** It only connects to public addresses (private and local ones are refused), and it limits rows per query, query time and requests per IP. Self-host to lift them, or open an issue if they get in your way.

**Can it browse S3 buckets?** Yes, one bucket per connection, with the limits [listed above](#s3-buckets).

**Is this related to `pg_query`?** No. [pg_query](https://github.com/pganalyze/libpg_query) is pganalyze's Postgres query parser library; pgquery is a database GUI.

## License

[MIT](LICENSE). Tuple the elephant is part of this project and shares its license. PostgreSQL is a trademark of the PostgreSQL Community Association; pgquery is not affiliated with it.
