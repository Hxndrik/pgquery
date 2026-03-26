# pgquery

A free, open-source, browser-based PostgreSQL database explorer and management tool. Full Supabase-level database management — no accounts, no subscriptions, no backend required.

## Features

### SQL Editor
- Monaco editor with SQL syntax highlighting and schema-aware autocompletion
- Multi-tab queries with persistent state
- Query history (500 entries) and saved queries
- CSV and JSON export
- Dark and light mode

### Database Management
- **Tables** — Browse, search, insert, edit, and delete rows with pagination and bulk actions
- **Schema Visualizer** — Interactive ER diagram with drag-and-drop, pan/zoom, and foreign key relationships
- **Functions** — List, view definitions, create, and drop PostgreSQL functions
- **Triggers** — List, enable/disable, create, and drop triggers
- **Enumerated Types** — List, create, add values, and drop enum types
- **Extensions** — Browse available extensions, install and uninstall
- **Indexes** — List with usage stats, create (btree/hash/gin/gist/brin), drop with concurrent support
- **Publications** — Manage logical replication publications

### Configuration
- **Roles** — List roles with attributes, create, alter, grant/revoke membership
- **Policies** — Enable/disable Row Level Security, create and manage RLS policies per table
- **Settings** — Browse all PostgreSQL settings by category, edit session and system-level settings

### Tools
- **Security Advisor** — Audit RLS status, superuser roles, public schema exposure, SSL, and password encryption with a security score
- **Performance Advisor** — Analyze cache hit ratio, unused indexes, table bloat, sequential scan patterns, and connection utilization
- **Query Performance** — pg_stat_statements analysis with sorting by total time, mean time, or call count

### Platform
- **Replication** — View replication slots and subscriptions
- **Foreign Data Wrappers** — Browse foreign servers and foreign tables

## Architecture

A single Docker container: a Go proxy serves the static frontend and bridges browser HTTP to Postgres TCP. No server-side state — all app state lives in localStorage. All database management features work through standard `pg_catalog` queries and DDL generation — no additional backend required.

```
Browser (React SPA) → Go proxy (:8080) → User's PostgreSQL
```

Every feature uses the same `/api/query` endpoint to execute introspection queries and DDL statements. The frontend generates all SQL, previews it before execution, and handles the results.

## Quick start

### Docker (recommended)

```bash
docker compose up --build
# Open http://localhost:8080
```

### Local development

Requirements: Node 20+, Go 1.22+

```bash
# Terminal 1
cd frontend && npm install && npm run dev

# Terminal 2
cd proxy && go run .

# Open http://localhost:5173
```

Or with make:

```bash
make dev
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP listen port |
| `STATIC_DIR` | `../frontend/dist` | Path to built frontend |
| `RATE_LIMIT_RPM` | `60` | Requests per minute per IP |
| `MAX_QUERY_TIMEOUT` | `30s` | Max query execution time |
| `MAX_ROWS` | `10000` | Max rows returned per query |

## Tech stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Monaco Editor, Zustand, Framer Motion
- **Backend**: Go, pgx v5
- **Deployment**: Docker, Coolify-compatible

## License

MIT
