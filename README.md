# pgquery

A free, open-source, browser-based PostgreSQL client. No accounts, no subscriptions, no freemium.

**Features**
- Monaco editor with SQL syntax highlighting
- Multi-tab queries with persistent state
- Schema browser with column details and row estimates
- Query history and saved queries
- CSV and JSON export
- Dark and light mode
- Connects to any PostgreSQL instance via connection string

## Architecture

A single Docker container: a Go proxy serves the static frontend and bridges browser HTTP to Postgres TCP. No server-side state — all app state lives in localStorage.

```
Browser → Go proxy (:8080) → User's PostgreSQL
```

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

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Monaco Editor, Zustand, Framer Motion
- **Backend**: Go 1.22, pgx v5
- **Deployment**: Docker, Coolify-compatible

## License

MIT
