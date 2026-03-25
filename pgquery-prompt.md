# pgquery — Build Prompt

> **Mode**: Start in plan mode. Read this entire prompt, explore the design reference, then produce a detailed implementation plan before writing any code. Execute the plan top-to-bottom once confirmed.

---

## 1. What We're Building

**pgquery** — A free, open-source, browser-based PostgreSQL client. No accounts, no subscriptions, no freemium. Users paste a connection string, write SQL, see results. Everything client-side except the thin SQL proxy (browsers can't speak Postgres's binary TCP protocol).

Two parts ship as one app:

1. **Landing page** (`/`) — Marketing page explaining the product with a CTA to launch the app
2. **SQL client app** (`/app`) — The actual query tool

Both share the same design system. Dark mode by default, with light mode toggle.

---

## 2. Architecture

```
┌─────────────────────────────────────┐
│          Docker Container           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │     Go proxy (port 8080)      │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Serves static frontend  │  │  │
│  │  │ /api/query  → pg proxy  │  │  │
│  │  │ /api/schema → introspect│  │  │
│  │  │ /api/test   → conn test │  │  │
│  │  │ IP rate limiting        │  │  │
│  │  │ Request size limits     │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
         ↕ TCP to user's Postgres
```

### Why this shape
- **Single container**: Simple Coolify / docker-compose deploy, one port
- **Go proxy**: ~5MB binary, compiles to static, perfect for `FROM scratch` or `alpine` image. Handles the TCP-to-HTTP bridge that browsers need
- **No backend state**: No database, no user accounts, no sessions. The proxy is purely pass-through
- **Frontend is fully static**: Vite builds to `dist/`, Go serves it. All app state lives in localStorage

---

## 3. Tech Stack

### Frontend
- **React 18** + **Vite** (fast builds, ESM-native)
- **TypeScript** (strict mode)
- **Tailwind CSS v3** — utility-first, configured with the custom design tokens
- **Monaco Editor** (`@monaco-editor/react`) — VS Code's editor for SQL
- **React Router v6** — `/` for landing, `/app` for the client
- **Zustand** — lightweight state management (connections, tabs, history)
- **Framer Motion** — subtle animations for landing page and UI transitions (keep it tasteful, not gratuitous)
- **react-hot-toast** or **sonner** — toast notifications for errors/success

### Backend (Go proxy)
- **Go 1.22+** standard library only (net/http, no frameworks)
- **pgx** (`github.com/jackc/pgx/v5`) — high-performance Postgres driver
- **No other dependencies** — keep it minimal

### Infrastructure
- **Docker** multi-stage build (Node for frontend → Go for binary → final alpine image)
- **docker-compose.yml** for Coolify deployment
- **Coolify-compatible** labels/config

---

## 4. Design System

### Reference
Study https://luxuryleasing.de/ for the visual DNA. Key characteristics to replicate:

- **Near-black backgrounds** with a subtle blue undertone (`#0c0e14` base, `hsl(225 10% 6%)`)
- **Subtle white-opacity borders**: `rgba(255,255,255,0.06)` default, `0.10` on hover, `0.15` for emphasis
- **Card style**: Dark cards (`#13151e`) with 1px subtle borders, 16px border-radius, generous padding (24-28px)
- **Typography**: Use a distinctive serif/display font for marketing headlines (something premium-feeling, NOT Inter for headlines — try Instrument Serif, Fraunces, or similar from Google Fonts). Use a clean sans-serif for UI text. JetBrains Mono for code.
- **Step indicators**: Numbered circles with connecting lines for process sections
- **Badges/pills**: Small rounded pills with colored backgrounds at ~8% opacity + matching text
- **Generous spacing**: Sections breathe. 80px+ between landing page sections, 48px between card groups
- **Light mode**: Inverts to warm whites (`#f5f5f3`), subtle warm gray borders, same structure
- **Animations**: Subtle fade-in-up on scroll for landing page sections. No excessive motion in the app.

### Color Tokens (CSS custom properties)

```
Dark mode (default):
  --bg:         #0c0e14    (page background)
  --bg-raised:  #12141c    (sidebar, panels)
  --bg-card:    #13151e    (cards, elevated surfaces)
  --bg-hover:   #191c26    (hover states)
  --bg-active:  #1f2230    (active/pressed)

  --fg:         #f0f0f2    (primary text)
  --fg-muted:   #b3b3bb    (secondary text)
  --fg-subtle:  #6b6b78    (tertiary, labels)
  --fg-faint:   #44445a    (disabled, hints)

  --border:     rgba(255,255,255,0.06)
  --border-mid: rgba(255,255,255,0.10)
  --border-strong: rgba(255,255,255,0.15)

  --accent:        #a78bfa  (primary accent — purple)
  --accent-bg:     rgba(167,139,250,0.08)
  --accent-border: rgba(167,139,250,0.20)

  --success:        #4ade80
  --success-bg:     rgba(74,222,128,0.08)
  --success-border: rgba(74,222,128,0.15)

  --warning:     #fbbf24
  --warning-bg:  rgba(251,191,36,0.08)

  --error:       #f87171
  --error-bg:    rgba(248,113,113,0.08)

Light mode (toggle):
  --bg:         #f5f5f3
  --bg-raised:  #ffffff
  --bg-card:    #ffffff
  --bg-hover:   #eeeee9
  --bg-active:  #e4e4df

  --fg:         #111110
  --fg-muted:   #6b6b68
  --fg-subtle:  #9a9a96
  --fg-faint:   #c4c4bf

  --border:     rgba(0,0,0,0.07)
  --border-mid: rgba(0,0,0,0.12)
  --border-strong: rgba(0,0,0,0.18)

  --accent:     #7c5cbf
  (... other tokens darken accordingly)
```

### Typography Scale
- Landing hero: 44-52px, serif display font, -1px letter-spacing
- Landing section titles: 32px, serif display font
- Landing body: 16px, sans-serif, line-height 1.7
- App UI text: 13px, sans-serif
- Code/editor: 13px, JetBrains Mono
- Labels/badges: 10-11px, uppercase, letter-spacing 0.5-1px
- Table headers: 11px, uppercase, letter-spacing 0.3px

### Border Radius Scale
- Cards, panels: 16px
- Buttons, inputs: 8px
- Pills, badges: 999px (full round)
- Small elements: 6px

---

## 5. Landing Page (`/`)

Structure (top to bottom):

### Navigation
- Logo mark (gradient purple square with "pq" in white, 8px radius) + "pgquery" wordmark
- Nav links: Features, Docs, GitHub (link to actual GitHub — use `#` placeholder)
- CTA button: "Open app" (pill-shaped, ghost style) → navigates to `/app`

### Hero Section
- Small pill badge: green dot + "Open source · Free forever"
- Large serif headline: "Your database, your way." (second line in muted color as a stylistic choice)
- Subtitle paragraph: "A modern PostgreSQL client that runs in your browser. No accounts, no subscriptions, no nonsense."
- Two buttons: "Launch pgquery" (solid white) + "View on GitHub" (ghost border)

### How It Works Section
- Section label with decorative line prefix: "HOW IT WORKS"
- Section title (serif): "From connect to query in seconds."
- Step indicator: 5 numbered circles (01–05) with connecting lines
- 3-column card grid below the steps:
  1. **Connect**: paste connection string or fill form
  2. **Query**: Monaco editor with syntax highlighting
  3. **Results**: fast table, export CSV/JSON
- Each card has: icon (create as inline SVG — database, code, table), title, description, bottom badge with checkmark

### Why pgquery Section
- 2×2 feature grid with large numbers:
  - Price: $0 — "Free forever. MIT licensed."
  - Data stored: 0 bytes — "Everything stays in your browser."
  - Setup time: <10s — "Paste URL. Run query. Done."
  - Dependencies: None — "No installs, no extensions."

### Features Section
- Larger cards (2-column) showcasing key features:
  - Monaco Editor with SQL intelligence
  - Multi-tab queries
  - Schema browser
  - Dark & light mode
  - Query history & saved queries
  - Export anywhere
- Use inline SVG illustrations/icons for each. Create simple but polished SVG art — geometric/abstract representations of each feature. NOT emoji, NOT icon fonts. Hand-crafted SVG paths.

### CTA Section
- Centered card with border: "Ready to query?"
- Description + "Launch pgquery" button

### Footer
- Minimal: logo, "MIT Licensed", "Made for developers", GitHub link

### Landing Page Animations
- Use Framer Motion `motion.div` with `whileInView` for fade-in-up reveals on sections
- Stagger children in card grids (50-100ms delay between cards)
- Keep it subtle — `y: 20` to `y: 0` with `opacity: 0` to `1`, duration 0.5s
- Hero section: slightly more dramatic entrance (larger y offset, sequential text reveal)

---

## 6. SQL Client App (`/app`)

### Layout (3-column)

```
┌──────┬────────────┬──────────────────────────────┐
│ Rail │  Sidebar   │  Main content                │
│ 52px │   220px    │  flex: 1                     │
│      │            │ ┌──────────────────────────┐ │
│  Q   │ Explorer   │ │ Tab bar                  │ │
│  T   │ ─────────  │ ├──────────────────────────┤ │
│  H   │ Connections│ │                          │ │
│  S   │  prod ●    │ │  Monaco Editor           │ │
│      │  staging   │ │                          │ │
│      │  local     │ │                          │ │
│      │ ─────────  │ ├──────────────────────────┤ │
│      │ Tables     │ │ Run bar (Run + Format +  │ │
│      │  users 12k │ │          meta info)      │ │
│  ◐   │  orders 89k│ ├──────────────────────────┤ │
│      │  products  │ │                          │ │
│      │  payments  │ │  Results (table/json)    │ │
│      │            │ │                          │ │
└──────┴────────────┴──┴──────────────────────────┘
```

### Icon Rail (leftmost, 52px wide)
- Logo mark at top (same gradient "pq" square)
- Icon buttons (stacked vertically):
  - **Q** — Queries (default active view)
  - **T** — Table browser
  - **H** — History
  - **S** — Saved queries
- Spacer
- Theme toggle at bottom (half-circle icon ◐)
- Use simple SVG icons, not icon libraries. Create them as React components.

### Sidebar (220px)
- Header: section title + add button
- Search/filter input
- Content changes based on rail selection:
  - **Queries**: lists open query tabs
  - **Tables**: schema browser with expandable tables showing columns, types, row counts
  - **History**: chronological list of executed queries with timestamps
  - **Saved**: user's saved/bookmarked queries

#### Connection Manager
- At the top of sidebar (always visible regardless of rail selection), show current connection as a pill/badge
- Click to open connection modal/dropdown
- Connection modal supports:
  - **URL mode**: single input for `postgres://user:pass@host:port/dbname`, `postgresql://...`
  - **Form mode**: individual fields for host, port, database, user, password, SSL toggle
  - Parse URL ↔ form bidirectionally (editing one updates the other)
  - "Test connection" button
  - Save to localStorage with a custom name
  - List of saved connections with connect/edit/delete
  - Visual indicator: green dot = connected, gray = disconnected

### Main Area — Editor
- **Tab bar**: horizontal tabs for open queries. Each tab has a name + close button. "+" to add new tab. Active tab highlighted.
- **Monaco Editor**:
  - SQL language mode
  - Theme matching the app (dark/light)
  - Minimap off by default
  - Word wrap on
  - Line numbers
  - Bracket matching
  - Basic SQL autocompletion (keywords + table/column names from schema introspection)
- **Run bar** below editor:
  - "Run" button (solid, with play icon SVG) — executes query
  - "Format" button (ghost style)
  - Right side: row count, execution time, keyboard shortcut badge (`Ctrl+Enter`)
  - Keyboard shortcut: `Ctrl+Enter` or `Cmd+Enter` runs the query

### Main Area — Results
- Resizable split with the editor (drag handle between editor and results)
- **Tab bar**: Table | JSON | Chart (chart is stretch goal, can be placeholder)
- **Table view**:
  - Sticky header row
  - Sortable columns (click header to sort)
  - Proper handling of NULL (styled differently, italic, muted)
  - Numeric values right-aligned, monospace font
  - Row hover highlight
  - Horizontal scroll for wide result sets
  - Show row count in header
- **JSON view**: Pretty-printed JSON with syntax highlighting
- **Export**: CSV and JSON download buttons in the results header
- **Empty state**: When no query has been run, show a subtle message like "Run a query to see results" with a keyboard shortcut hint
- **Error state**: Show SQL errors clearly with the error message styled in red/error colors

### State Management (Zustand stores)

```typescript
// connectionStore: saved connections, active connection
// tabStore: open tabs, active tab, each tab's SQL content + results
// historyStore: query history (query text, timestamp, duration, row count)
// savedStore: saved/bookmarked queries
// settingsStore: theme, editor preferences
```

All stores persist to localStorage via zustand/persist middleware.

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter` — Run query
- `Ctrl/Cmd + S` — Save query
- `Ctrl/Cmd + N` — New tab
- `Ctrl/Cmd + W` — Close tab
- `Ctrl/Cmd + K` — Focus command palette / connection switcher (stretch goal)

---

## 7. Go Proxy API

### Endpoints

#### `POST /api/query`
```json
// Request
{
  "connection": "postgres://user:pass@host:5432/db?sslmode=require",
  "query": "SELECT * FROM users LIMIT 50",
  "params": []  // optional prepared statement params
}

// Response (success)
{
  "columns": [
    { "name": "id", "type": "int4" },
    { "name": "name", "type": "varchar" },
    { "name": "email", "type": "varchar" }
  ],
  "rows": [
    [1, "Alice", "alice@example.com"],
    [2, "Bob", null]
  ],
  "rowCount": 2,
  "duration": 34  // milliseconds
}

// Response (error)
{
  "error": "relation \"nonexistent\" does not exist",
  "code": "42P01",
  "position": 15
}
```

#### `POST /api/schema`
```json
// Request
{
  "connection": "postgres://..."
}

// Response
{
  "schemas": [
    {
      "name": "public",
      "tables": [
        {
          "name": "users",
          "rowEstimate": 12400,
          "columns": [
            { "name": "id", "type": "integer", "nullable": false, "isPrimary": true },
            { "name": "name", "type": "varchar(255)", "nullable": false, "isPrimary": false },
            { "name": "email", "type": "varchar(255)", "nullable": true, "isPrimary": false }
          ]
        }
      ]
    }
  ]
}
```

Uses `pg_catalog` introspection queries under the hood.

#### `POST /api/test`
```json
// Request
{ "connection": "postgres://..." }

// Response
{ "ok": true, "version": "PostgreSQL 16.2", "database": "mydb" }
// or
{ "ok": false, "error": "connection refused" }
```

### Proxy Implementation Details

- **Connection lifecycle**: Open a new connection per request, close after response. No pooling (the proxy is stateless, connections belong to users). Set a reasonable connect timeout (5s) and query timeout (30s).
- **Request size limit**: 1MB max body size
- **Rate limiting**: In-memory IP-based rate limiter. 60 requests/minute per IP. Return 429 with `Retry-After` header. Use a simple token bucket or sliding window. No external dependencies.
- **CORS**: Allow all origins (it's a tool, not a SaaS with auth)
- **Security headers**: Standard security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **Connection string validation**: Parse and validate before attempting connection. Support `postgres://` and `postgresql://` schemes. Support `sslmode` parameter.
- **Query timeout**: Cancel queries that exceed 30 seconds
- **Response streaming**: For large result sets, consider a max row limit (e.g., 10,000 rows) and return a `truncated: true` flag

### Static File Serving
- Serve the Vite build output from an embedded filesystem or a directory
- SPA fallback: any non-`/api/*` route serves `index.html`
- Proper cache headers: hashed assets get `Cache-Control: public, max-age=31536000`, index.html gets `no-cache`

---

## 8. Docker & Deployment

### Dockerfile (multi-stage)

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go binary
FROM golang:1.22-alpine AS backend
WORKDIR /app
COPY proxy/ ./
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o pgquery-proxy .

# Stage 3: Final image
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=backend /app/pgquery-proxy /usr/local/bin/
COPY --from=frontend /app/frontend/dist /app/static
EXPOSE 8080
CMD ["pgquery-proxy"]
```

### docker-compose.yml (Coolify-compatible)

```yaml
services:
  pgquery:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - STATIC_DIR=/app/static
      - RATE_LIMIT_RPM=60
      - MAX_QUERY_TIMEOUT=30s
      - MAX_ROWS=10000
    restart: unless-stopped
    labels:
      - "coolify.managed=true"
```

### Local development (F5 config)

Create a `Makefile` or script that:
1. Runs `cd frontend && npm run dev` (Vite dev server on :5173)
2. Runs `cd proxy && go run .` (Go proxy on :8080)
3. Vite proxies `/api/*` to Go via `vite.config.ts` proxy config

Also include a `.vscode/launch.json` for F5 debugging of the Go proxy.

---

## 9. Project Structure

```
pgquery/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css                  # Tailwind imports + CSS variables
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # Shared UI primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Tooltip.tsx
│   │   │   │   └── ThemeToggle.tsx
│   │   │   │
│   │   │   ├── landing/               # Landing page sections
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── Nav.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── WhySection.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── CTA.tsx
│   │   │   │   └── Footer.tsx
│   │   │   │
│   │   │   ├── app/                   # SQL client app
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── IconRail.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── ConnectionManager.tsx
│   │   │   │   ├── SchemaExplorer.tsx
│   │   │   │   ├── QueryHistory.tsx
│   │   │   │   ├── SavedQueries.tsx
│   │   │   │   ├── TabBar.tsx
│   │   │   │   ├── Editor.tsx         # Monaco wrapper
│   │   │   │   ├── RunBar.tsx
│   │   │   │   ├── Results.tsx
│   │   │   │   ├── ResultsTable.tsx
│   │   │   │   ├── ResultsJSON.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   │
│   │   │   └── icons/                 # Hand-crafted SVG icon components
│   │   │       └── index.tsx
│   │   │
│   │   ├── stores/
│   │   │   ├── connectionStore.ts
│   │   │   ├── tabStore.ts
│   │   │   ├── historyStore.ts
│   │   │   ├── savedStore.ts
│   │   │   └── settingsStore.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                 # Fetch wrappers for /api/*
│   │   │   ├── connectionParser.ts    # URL ↔ form parsing
│   │   │   └── exportUtils.ts         # CSV/JSON export
│   │   │
│   │   └── hooks/
│   │       ├── useKeyboardShortcuts.ts
│   │       └── useResizable.ts        # Drag-to-resize panels
│   │
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── proxy/
│   ├── main.go                        # Entry point, server setup
│   ├── handler_query.go               # /api/query handler
│   ├── handler_schema.go              # /api/schema handler
│   ├── handler_test_conn.go           # /api/test handler
│   ├── middleware.go                   # Rate limiter, CORS, security headers
│   ├── static.go                      # Static file serving with SPA fallback
│   ├── go.mod
│   └── go.sum
│
├── docker-compose.yml
├── Dockerfile
├── Makefile
├── .vscode/
│   └── launch.json
├── .gitignore
├── LICENSE                            # MIT
└── README.md
```

---

## 10. Quality Checklist

Before considering the project complete, verify:

### Functionality
- [ ] Can connect via `postgres://` URL and manual form
- [ ] URL and form fields sync bidirectionally
- [ ] Test connection shows success/failure with Postgres version
- [ ] Schema browser loads tables, columns, types, row estimates
- [ ] Monaco editor has SQL syntax highlighting
- [ ] Ctrl+Enter runs the query
- [ ] Results render in a table with proper types, NULL handling, sorting
- [ ] JSON view works
- [ ] CSV and JSON export work
- [ ] Multi-tab: can open, close, switch tabs, each has own SQL + results
- [ ] Query history persists across sessions
- [ ] Saved queries: can save, load, delete
- [ ] Connection manager: save, load, edit, delete connections
- [ ] Dark/light theme toggle works across all components
- [ ] Rate limiting returns 429 properly

### Design Quality
- [ ] Landing page matches the luxuryleasing.de aesthetic (dark, spacious, premium)
- [ ] All SVG icons/art are hand-crafted, not emoji or icon fonts
- [ ] Typography uses distinctive fonts (serif display + sans body + mono code)
- [ ] Animations are subtle and purposeful (landing: scroll reveals; app: transitions)
- [ ] Responsive: landing page works on mobile, app has a reasonable tablet+ breakpoint
- [ ] No visual jank: borders, shadows, spacing are pixel-perfect
- [ ] Hover states on all interactive elements
- [ ] Focus styles for keyboard accessibility
- [ ] Empty states are designed, not just blank
- [ ] Error states are clear and styled

### Code Quality
- [ ] TypeScript strict mode, no `any` types
- [ ] Components are DRY — shared UI primitives used consistently
- [ ] Zustand stores are clean, well-typed
- [ ] Go code is idiomatic, well-structured
- [ ] No hardcoded values — all design tokens in CSS variables / Tailwind config
- [ ] Proper error handling in both frontend and proxy
- [ ] No console errors or warnings

### Deployment
- [ ] `docker-compose up --build` works
- [ ] Final Docker image is <50MB
- [ ] Local dev with `make dev` or equivalent works (Vite + Go concurrent)
- [ ] `.vscode/launch.json` enables F5 debugging

---

## 11. Implementation Order

Follow this order strictly:

1. **Scaffold** — Create project structure, install dependencies, configure Tailwind + Vite + TypeScript
2. **Design tokens** — Set up CSS variables, Tailwind config, fonts, theme toggle infrastructure
3. **UI primitives** — Build shared components (Button, Input, Badge, Modal, ThemeToggle)
4. **SVG icons** — Create all needed icons as React components
5. **Landing page** — Build all sections top to bottom, with animations
6. **Go proxy** — Build all 3 endpoints + middleware + static serving
7. **App layout** — Icon rail, sidebar shell, main area with editor/results split
8. **Connection manager** — Modal, URL/form parsing, localStorage persistence
9. **Editor** — Monaco integration, SQL mode, theme sync, keyboard shortcuts
10. **Query execution** — Wire editor → API → results
11. **Results** — Table view, JSON view, sorting, export
12. **Schema browser** — Fetch + display tables/columns from /api/schema
13. **Tabs** — Multi-tab state management, tab bar UI
14. **History & saved queries** — Stores + sidebar views
15. **Docker** — Dockerfile, docker-compose, Makefile
16. **Polish** — Animations, empty states, error states, responsive tweaks, README

---

## 12. Important Notes

- **Do NOT use icon libraries** (lucide, heroicons, fontawesome). Create all icons as inline SVG React components. They should be simple, geometric, and match the design language.
- **Do NOT use component libraries** (shadcn, radix, MUI). Build UI primitives from scratch with Tailwind. The only allowed "heavy" dependency is Monaco Editor.
- **SVG art for landing page**: Create original SVG illustrations for feature cards. Think abstract/geometric: a stylized database cylinder, a code bracket composition, a table grid, etc. Keep them monochrome or use the accent color. These should feel intentional and designed, not clip-art.
- **The landing page must feel premium**. Study the luxuryleasing.de reference. The quality bar is high-end SaaS, not weekend project.
- **The app must feel snappy**. No loading spinners where they aren't needed. Optimistic UI. Instant tab switching. Results appear fast.
- **Connection strings contain passwords** — never log them, never send them anywhere except directly to the user's specified Postgres host. The proxy is a dumb pipe.
- **Test with a real Postgres database** if one is available, otherwise ensure the code compiles and the UI is fully functional with mock/empty states.
