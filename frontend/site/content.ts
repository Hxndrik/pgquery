import { DOCKER_RUN, PORT, REPO } from './facts'

export interface Guide {
  slug: string
  /** <title>: query-shaped, under ~60 characters */
  title: string
  description: string
  eyebrow: string
  h1: string
  lede: string
  /** Body HTML, written as a short chapter of the manual. */
  body: string
  faq: [string, string][]
  /** Short label for menus and the contents list. */
  label: string
}

const run = `<pre><code>${DOCKER_RUN}</code></pre>`

export const GUIDES: Guide[] = [
  {
    slug: 'postgres-gui-in-browser',
    label: 'Postgres GUI in the browser',
    title: 'Postgres GUI in your browser — free and open source',
    description:
      'A free PostgreSQL GUI that runs in the browser: SQL editor, table editor, ER diagram, roles, RLS and advisors. Self-host it as one Docker container.',
    eyebrow: 'Guide · Getting started',
    h1: 'A Postgres GUI that runs in your browser',
    lede: 'pgquery gives you a full PostgreSQL client in a browser tab. Nothing to install on your laptop, no account, and the server side is one small container.',
    body: `
<h2>What you get</h2>
<p>Everything you would expect from a desktop client, plus the admin screens most clients skip:</p>
<ul>
  <li>A SQL editor with schema-aware autocomplete, tabs, history and CSV or JSON export.</li>
  <li>A table editor for browsing, sorting, paginating and editing rows, including JSONB.</li>
  <li>An ER diagram of your schema, exportable as SVG or PNG.</li>
  <li>Roles, grants, Row Level Security policies, indexes, extensions, triggers and functions.</li>
  <li>A query plan viewer, a performance advisor and a security advisor.</li>
</ul>
<h2>How it works</h2>
<p>The interface is a single-page app. A Go proxy in the same container turns HTTP requests from your browser into Postgres connections, runs the query and returns rows. The proxy keeps no state: saved connections, tabs and history live in your browser's localStorage.</p>
<h2>Run it</h2>
${run}
<p>Then open <code>http://localhost:${PORT}</code> and paste a connection string. Both <code>postgres://user:pass@host:5432/db</code> URIs and key=value strings (libpq and Npgsql style) work.</p>
<h2>When a browser client is the right choice</h2>
<p>A browser client shines when you work from several machines, want to give a teammate access without installing anything, or run Postgres on a server where a desktop app cannot reach it directly. Put pgquery next to the database, behind your VPN or reverse proxy, and everyone gets the same tool at one URL.</p>`,
    faq: [
      ['Is pgquery free?', 'Yes. It is MIT licensed, free to use, modify and self-host, with no paid tier.'],
      ['Does my data pass through a third party?', 'Only through the proxy you run. When you self-host, queries go from your browser to your container to your database.'],
      ['Which Postgres versions work?', 'Any server reachable over the normal wire protocol. Catalog queries use standard pg_catalog views.'],
    ],
  },
  {
    slug: 'pgadmin-alternative',
    label: 'pgAdmin alternative',
    title: 'A lightweight pgAdmin alternative — pgquery',
    description:
      'Looking for a pgAdmin alternative? pgquery is a fast, open-source Postgres studio in the browser with a modern SQL editor, RLS editor and advisors.',
    eyebrow: 'Guide · Comparison',
    h1: 'A lighter alternative to pgAdmin',
    lede: 'pgAdmin is the long-standing reference tool for PostgreSQL and covers almost everything. pgquery covers the daily work with less weight and a faster editor.',
    body: `
<h2>Where pgAdmin is stronger</h2>
<p>pgAdmin has been maintained by the PostgreSQL community for many years. It has dialogs for nearly every object type, backup and restore through pg_dump, a visual query plan, a debugger for PL/pgSQL and multi-server management. If you need those, keep it.</p>
<h2>Where pgquery is different</h2>
<ul>
  <li><strong>Small footprint.</strong> One container with a Go binary and static files. No Python runtime, no internal database for settings.</li>
  <li><strong>Editor first.</strong> Monaco with autocomplete from your live schema, tabs that survive a reload, and history.</li>
  <li><strong>Security in view.</strong> A Row Level Security editor and a scored security audit are first-class screens.</li>
  <li><strong>SQL before it runs.</strong> Every change you make through a form is shown as SQL, and you run it yourself.</li>
</ul>
<h2>Try both</h2>
${run}
<p>pgquery listens on port ${PORT}. You can run it next to pgAdmin and point both at the same database.</p>`,
    faq: [
      ['Can pgquery replace pgAdmin entirely?', 'For querying, browsing data and managing roles, policies, indexes and extensions, yes. For backup and restore or PL/pgSQL debugging, pgAdmin still does more.'],
      ['Is pgquery a fork of pgAdmin?', 'No. It is a separate project: a React frontend and a small Go proxy.'],
    ],
  },
  {
    slug: 'supabase-studio-alternative',
    label: 'Supabase Studio alternative',
    title: 'Supabase Studio alternative for any Postgres — pgquery',
    description:
      'The table editor, RLS policies and advisors you know from Supabase Studio, for any PostgreSQL database. Self-hosted in one container.',
    eyebrow: 'Guide · Comparison',
    h1: 'Supabase-style database screens for any Postgres',
    lede: 'Supabase Studio is a great dashboard for Supabase projects. pgquery brings the database parts of it to any PostgreSQL server: RDS, Neon, a VPS or your laptop.',
    body: `
<h2>The familiar parts</h2>
<p>If you have used Studio, you will recognise the shape: a table editor, a SQL editor, an ER diagram, Row Level Security policies, roles, extensions, indexes, publications, and security and performance advisors.</p>
<h2>What is different</h2>
<ul>
  <li><strong>Any Postgres.</strong> No Supabase project, auth schema or storage service needed.</li>
  <li><strong>One container.</strong> Self-hosting Studio usually means running the Supabase stack. pgquery is one image.</li>
  <li><strong>Database only.</strong> There is no auth, storage or edge functions UI. pgquery stays a database tool.</li>
</ul>
<h2>Useful for Supabase users too</h2>
<p>You can point pgquery at a Supabase database with its direct connection string. That is handy for comparing environments or giving a teammate read access through a role you create for them.</p>
${run}`,
    faq: [
      ['Is pgquery affiliated with Supabase?', 'No. It is an independent open-source project.'],
      ['Does it support Supabase databases?', 'Yes. Supabase databases are regular Postgres; use the direct or pooler connection string.'],
    ],
  },
  {
    slug: 'postgres-rls-policy-editor',
    label: 'RLS policy editor',
    title: 'Postgres Row Level Security (RLS) policy editor',
    description:
      'Enable Row Level Security, write and review RLS policies per table, and audit which tables are unprotected. Free, open-source, in your browser.',
    eyebrow: 'Chapter 8 · Policies',
    h1: 'Edit Row Level Security policies without guesswork',
    lede: 'Row Level Security decides which rows each role can see or change. pgquery shows every table, whether RLS is on, and the policies that apply, and it writes the SQL for you to review.',
    body: `
<h2>See the state of every table</h2>
<p>The Policies screen lists tables with RLS on or off and the policies attached to each: the command (SELECT, INSERT, UPDATE, DELETE or ALL), the roles it targets, and its USING and WITH CHECK expressions.</p>
<h2>Create a policy</h2>
<p>Pick a table, a command and roles, then write the expressions. pgquery shows the generated statement before anything runs, for example:</p>
<pre><code>ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_playlists_visible
  ON playlists FOR SELECT
  USING (is_public);</code></pre>
<h2>Find the gaps</h2>
<p>The Security Advisor flags tables that have RLS disabled, alongside superuser roles, public schema grants, SSL and password hashing settings, and gives an overall score.</p>
<h2>Remember</h2>
<ul>
  <li>Table owners and superusers bypass RLS unless you use <code>FORCE ROW LEVEL SECURITY</code>.</li>
  <li>With RLS on and no policies, a table returns no rows to ordinary roles.</li>
  <li>Policies combine with OR within a command unless you create them <code>AS RESTRICTIVE</code>.</li>
</ul>`,
    faq: [
      ['Does enabling RLS lock out my application?', 'It can. With RLS on and no matching policy, ordinary roles see no rows. Create policies first, then enable it, and test with the role your app uses.'],
      ['Can I test a policy as another role?', 'Run SET ROLE some_role; in the SQL editor, query the table, then RESET ROLE.'],
    ],
  },
  {
    slug: 'postgres-er-diagram',
    label: 'Postgres ER diagram',
    title: 'Postgres ER diagram from your live schema — export SVG/PNG',
    description:
      'Draw an entity-relationship diagram of any PostgreSQL schema from its foreign keys, rearrange it, and export a printable SVG or PNG plate.',
    eyebrow: 'Chapter 6 · Schema map',
    h1: 'An ER diagram of your Postgres schema, drawn from the database',
    lede: 'Connect, open Schema Map, and pgquery draws every table and foreign key in the schema. Drag tables where you want them, then export the result as a plate to print or share.',
    body: `
<h2>From the catalog, not from guesses</h2>
<p>The diagram is built from <code>pg_catalog</code>: tables, columns, primary keys and foreign key constraints. Nothing to annotate, and it is always current.</p>
<h2>Arrange it</h2>
<p>Drag tables, pan and zoom. Lines follow the foreign keys so you can trace how orders reach customers or tracks reach artists.</p>
<h2>Export a plate</h2>
<p>Export plate saves the diagram as an SVG or a 2× PNG with a title block: database and schema name, table and relationship counts, and the date. It is sized to drop into a design doc, a README or an onboarding page, or to print and pin up.</p>`,
    faq: [
      ['Does it work with large schemas?', 'Yes. Pick one schema at a time; you can pan and zoom around large diagrams.'],
      ['Is the export editable?', 'The SVG is plain vector markup, so you can open it in Figma, Inkscape or Illustrator.'],
    ],
  },
  {
    slug: 'explain-analyze-visualizer',
    label: 'EXPLAIN ANALYZE visualizer',
    title: 'EXPLAIN ANALYZE visualizer for Postgres query plans',
    description:
      'Paste a query, run EXPLAIN or EXPLAIN ANALYZE, and read the Postgres plan as a tree with timings, row estimates and the slowest node highlighted.',
    eyebrow: 'Chapter 4 · Query plans',
    h1: 'Read Postgres query plans as a tree, not a wall of text',
    lede: 'Next to Run in the SQL editor are Explain and Explain analyze. pgquery runs EXPLAIN with FORMAT JSON and draws the plan so the expensive part stands out.',
    body: `
<h2>What it shows</h2>
<ul>
  <li>Every plan node as a tree: scans, joins, sorts, aggregates.</li>
  <li>The relation and index each node touches.</li>
  <li>Estimated rows, and with ANALYZE the actual rows and time.</li>
  <li>A bar for each node's share of the total time, and a highlight on the slowest one.</li>
  <li>A warning where the planner's row estimate is off by 10× or more, the usual cause of a bad plan.</li>
</ul>
<h2>Plain EXPLAIN vs EXPLAIN ANALYZE</h2>
<p>EXPLAIN only plans the query. EXPLAIN ANALYZE actually executes it to collect real timings. For INSERT, UPDATE or DELETE that means the change happens, so pgquery asks before analyzing a data-modifying statement. To analyze one safely, wrap it in <code>BEGIN; … ROLLBACK;</code>.</p>
<h2>Typical fixes</h2>
<ul>
  <li>A sequential scan on a large table with a selective filter: add an index.</li>
  <li>Estimates far from actuals: run <code>ANALYZE table_name;</code> or raise the statistics target.</li>
  <li>A sort spilling to disk: an index on the ORDER BY columns or more <code>work_mem</code>.</li>
</ul>`,
    faq: [
      ['Does EXPLAIN ANALYZE change data?', 'It runs the statement. SELECTs are safe; INSERT, UPDATE and DELETE really execute unless you wrap them in a transaction you roll back.'],
      ['Do I need an extension?', 'No. EXPLAIN is built into PostgreSQL.'],
    ],
  },
  {
    slug: 'pg-stat-statements-viewer',
    label: 'pg_stat_statements viewer',
    title: 'pg_stat_statements viewer — find slow Postgres queries',
    description:
      'Find your slowest and most frequent Postgres queries with pg_stat_statements, sorted by total time, mean time or calls. Free and open source.',
    eyebrow: 'Chapter 10 · Query performance',
    h1: 'Find the queries that cost you the most',
    lede: 'pg_stat_statements records every normalized query the server runs. pgquery turns it into a sortable table so the expensive ones rise to the top.',
    body: `
<h2>Turn it on</h2>
<p>The extension ships with PostgreSQL but needs to be preloaded:</p>
<pre><code># postgresql.conf
shared_preload_libraries = 'pg_stat_statements'</code></pre>
<p>Restart the server, then run <code>CREATE EXTENSION pg_stat_statements;</code>. Most managed services (RDS, Cloud SQL, Supabase, Neon) have it available already.</p>
<h2>Read it</h2>
<ul>
  <li><strong>Total time</strong> finds what costs the server the most overall.</li>
  <li><strong>Mean time</strong> finds the individually slow queries users wait on.</li>
  <li><strong>Calls</strong> finds chatty code: N+1 loops and missing caching.</li>
</ul>
<p>Copy a query into the SQL editor and press Explain to see why it is slow.</p>
<h2>And the rest of the picture</h2>
<p>The Performance Advisor adds cache hit ratio, unused indexes, table bloat, sequential scan hot spots and connection use.</p>`,
    faq: [
      ['Which role can read pg_stat_statements?', 'Superusers and members of pg_read_all_stats see all queries; other roles see only their own.'],
      ['Does it slow the server down?', 'The overhead is small and it is widely enabled in production.'],
    ],
  },
  {
    slug: 'self-hosted-postgres-gui-docker',
    label: 'Self-hosted with Docker',
    title: 'Self-hosted Postgres GUI with Docker in one command',
    description:
      'Run a self-hosted PostgreSQL GUI with one docker run: SQL editor, tables, ER diagram, roles, RLS and advisors. Configuration, reverse proxy and security notes.',
    eyebrow: 'Chapter 13 · Self-hosting',
    h1: 'Self-host a Postgres GUI with one Docker command',
    lede: 'pgquery is one image: a Go binary that serves the app and proxies queries. Run it on your laptop, a VPS or inside your cluster.',
    body: `
<h2>Run</h2>
${run}
<p>Open <code>http://localhost:${PORT}</code>. Images are published for amd64 and arm64.</p>
<h2>Docker Compose</h2>
<pre><code>services:
  pgquery:
    image: ghcr.io/hxndrik/pgquery
    ports:
      - "${PORT}:${PORT}"
    environment:
      RATE_LIMIT_RPM: 120
    restart: unless-stopped</code></pre>
<h2>Settings</h2>
<ul>
  <li><code>PORT</code>: listen port, default ${PORT}.</li>
  <li><code>RATE_LIMIT_RPM</code>: requests per minute per client IP.</li>
  <li><code>MAX_QUERY_TIMEOUT</code> and <code>MAX_ROWS</code>: limits per query.</li>
  <li><code>BLOCK_PRIVATE_HOSTS=true</code>: refuse connections to private and local addresses. Use it on public instances.</li>
  <li><code>DEMO_DATABASE_URL</code>: offer a demo database without exposing its credentials.</li>
</ul>
<h2>Security notes</h2>
<p>pgquery has no login of its own. Anyone who can reach it can use it to connect to databases they have credentials for. Put it behind your VPN, an authenticating reverse proxy (oauth2-proxy, Authelia, Cloudflare Access) or bind it to localhost.</p>
<p>Source: <a href="${REPO}">${REPO.replace('https://', '')}</a></p>`,
    faq: [
      ['Does the container store my passwords?', 'No. Connection strings are saved in your browser and sent with each request; the container keeps no state.'],
      ['Can I run it on a Raspberry Pi?', 'Yes. There is an arm64 image.'],
    ],
  },
]

export const HOME_FAQ: [string, string][] = [
  ['What is pgquery?', 'A free, open-source PostgreSQL GUI that runs in your browser: SQL editor, table editor, ER diagram, RLS policies, roles, indexes, an EXPLAIN plan viewer and performance and security advisors.'],
  ['Is it really free?', 'Yes. MIT licensed, no paid tier, no account.'],
  ['Where are my connection strings stored?', "In your browser's localStorage. The proxy forwards each query and keeps nothing."],
  ['How do I self-host it?', `Run ${DOCKER_RUN} and open http://localhost:${PORT}.`],
  ['Does it work with RDS, Supabase, Neon or a VPS?', 'Yes. Any PostgreSQL server the container can reach over the network.'],
  ['Is pgquery related to the pg_query parser library?', 'No. pg_query by pganalyze is a Postgres query parser for developers; pgquery is a database GUI.'],
]
