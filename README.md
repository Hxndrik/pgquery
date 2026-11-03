<p align="center">
  <a href="https://pgquery.dev"><img src="docs/assets/banner.svg" alt="pgquery, with Tuple the pixel elephant" width="680"></a>
</p>

<p align="center">
  <b>A free, open-source Postgres studio that runs in your browser.</b><br>
  One Docker container. No account. Every statement shown before it runs.
</p>

<p align="center">
  <a href="https://pgquery.dev/app/?demo"><b>Try the demo</b></a> ·
  <a href="https://pgquery.dev">Website</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#features">Features</a> ·
  <a href="https://pgquery.dev/postgres-client-comparison/">Comparison</a> ·
  <a href="https://pgquery.dev/self-hosted-postgres-gui-docker/">Self-hosting guide</a>
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

## Quick start

```bash
docker run -p 54280:54280 ghcr.io/hxndrik/pgquery
```

`latest` is the newest release; `main` follows the main branch. Pin a version with e.g. `ghcr.io/hxndrik/pgquery:1.0`.

Open <http://localhost:54280> and paste a connection string. Both `postgres://user:pass@host:5432/db` URIs and Npgsql / ADO.NET style key=value strings (`Host=…;Database=…`) work.

Or with Docker Compose:

```yaml
services:
  pgquery:
    image: ghcr.io/hxndrik/pgquery
    ports:
      - "54280:54280"
    restart: unless-stopped
```

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
| <img src="docs/assets/icons/bucket.svg" width="16" alt=""> **S3 browser** | Browse, preview, upload and delete objects in S3-compatible buckets |

Schema changes made through forms (CREATE, ALTER, GRANT, CREATE POLICY …) are shown as SQL first, and you run them yourself.

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

## How it compares

| | pgquery | pgAdmin 4 | CloudBeaver | Adminer | Supabase Studio |
|---|---|---|---|---|---|
| Runs in the browser | yes | yes (server mode) | yes | yes | yes |
| Self-hosted as | one Go container | Python web app | Java web app | one PHP file | part of the Supabase stack |
| Databases | PostgreSQL | PostgreSQL | many | many | PostgreSQL (Supabase) |
| License | MIT | PostgreSQL License | Apache 2.0 | Apache 2.0 or GPL 2 | Apache 2.0 |

pgAdmin does more administration (backup and restore, a PL/pgSQL debugger, user accounts), and DBeaver and Adminer speak many databases. pgquery has no login of its own and no SSH tunnels. The [full, honest comparison](https://pgquery.dev/postgres-client-comparison/) lists where it wins and where it loses.

## How it works

```
Browser (React app) ──HTTP──▶ Go proxy ──Postgres protocol──▶ your database
```

- The proxy is stateless. It opens a connection per request, runs the query and returns rows.
- Saved connections, tabs and history live in your browser's localStorage.
- pgquery has no login of its own. On a shared server, put it behind your VPN or an authenticating reverse proxy (oauth2-proxy, Authelia, Cloudflare Access).

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `54280` | HTTP listen port |
| `STATIC_DIR` | `../frontend/dist` | Built frontend (set to `/app/static` in the image) |
| `RATE_LIMIT_RPM` | `600` | Requests per minute per client IP |
| `MAX_QUERY_TIMEOUT` | `30s` | Maximum query time |
| `MAX_ROWS` | `10000` | Maximum rows returned per query |
| `DEMO_DATABASE_URL` | – | For a public demo instance. An admin `postgres://` URL to a **dedicated** database. On startup the app seeds a sample record store ([`proxy/demo/seed.sql`](proxy/demo/seed.sql)) and serves it through a SELECT-only role with a random password. The admin URL never reaches the browser |
| `DEMO_RESET_INTERVAL` | `24h` | How often the demo is re-seeded; `0` seeds once |
| `ALLOW_PRIVATE_HOSTS` | `false` | With a demo configured, connections to loopback, private and link-local addresses are refused, so a public instance can't be used to reach your network. `true` allows them anyway. Without a demo nothing is blocked |

Build-time settings for the public website (Docker build args):

| Build arg | Default | Description |
|---|---|---|
| `VITE_SITE_URL` | `https://pgquery.dev` | Canonical URL for pages, sitemap and share images |
| `VITE_GOATCOUNTER_CODE` | – | Optional GoatCounter site code for privacy-friendly page counts |

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

**Is it really free?** Yes. MIT licensed, no paid tier, no account.

**Does my data go through your servers?** Only if you use the hosted demo at pgquery.dev. When you self-host, queries go from your browser to your container to your database.

**Is this related to `pg_query`?** No. [pg_query](https://github.com/pganalyze/libpg_query) is pganalyze's Postgres query parser library; pgquery is a database GUI.

## License

[MIT](LICENSE). Tuple the elephant is part of this project and shares its license. PostgreSQL is a trademark of the PostgreSQL Community Association; pgquery is not affiliated with it.
