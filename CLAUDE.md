# CLAUDE.md

Guidance for AI coding assistants (and humans) working in this repository.

## What this is

pgquery is a browser-based PostgreSQL GUI shipped as one Docker image:

- `frontend/src`: the React 19 + Vite app, served at `/app`
- `frontend/site`: the public website and guides, rendered to static HTML at build time by `site/plugin.ts`
- `frontend/src/brand/pixels.ts`: the pixel art (Tuple the elephant, icons) everything else is drawn from
- `proxy`: a stateless Go server that serves the build and forwards queries to Postgres (`/api/query`, `/api/schema`, `/api/test`); it also seeds the optional demo database (`proxy/demo.go`, `proxy/demo/seed.sql`)

## Commands

```bash
make dev                                   # Vite on :28000, proxy on :54280
cd frontend && npm run build               # type-check + build (CI runs this)
cd frontend && npm run lint                # ESLint (some existing react-hooks findings)
cd proxy && go vet ./... && go test ./...  # Go checks (CI runs these)
node scripts/assets/build.ts               # regenerate brand assets after changing pixels.ts
```

## House rules

- **SQL before it runs.** Any schema change made through a form must show the generated SQL and let the user run it. DDL lives in `frontend/src/lib/ddlGenerators.ts`, catalog queries in `frontend/src/lib/pgCatalogQueries.ts`.
- **Design tokens only.** Colors, fonts and radii come from `frontend/src/index.css` / `tailwind.config.js`. No hard-coded hex values or Tailwind palette classes in components; Monaco and file exports read `frontend/src/brand/colors.ts`. Both light and dark themes must work.
- **One accent in the app.** Highlighter yellow (`--accent`, `--accent-text`, `--accent-bg`, `--accent-border`) is the only accent; green, amber and red are only for status. The website may also use blue ink as a secondary color.
- **No server state.** Connections, tabs and history live in the browser (`pgquery-*` localStorage keys; don't rename them, users would lose data).
- **Facts in copy.** Website, README and guide claims must match what the code does. No invented numbers.
- **Safe defaults.** Default views should open on user data (prefer the `public` schema) and never on something that can error.
- **Conventional commits.** Commit messages and PR titles start with `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` or `test:`. Releases and the changelog are generated from them (release-please).

## Working style

- Plan first for anything non-trivial (3+ steps or an architectural choice); re-plan if something goes sideways.
- Find root causes; no temporary workarounds.
- Keep changes minimal and focused; one concern per PR.
- Prove it works before calling it done: run the checks above, and for UI changes look at the result in the browser (light and dark, desktop and phone width).
- Record recurring pitfalls in `tasks/lessons.md`; track larger work in `tasks/todo.md`.
