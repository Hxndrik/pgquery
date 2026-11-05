import { DATA_NOTE, DOCKER_RUN, HOSTED_LIMITS, ISSUES, PORT, REPO } from './facts'
import { COMPARE_GUIDES } from './guides-compare'
import { CONNECT_GUIDES } from './guides-connect'

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
  /** Full-width body (comparison tables) instead of text column + sidebar. */
  wide?: boolean
}

const run = `<pre><code>${DOCKER_RUN}</code></pre>`

const CORE_GUIDES: Guide[] = [
  {
    slug: 's3-bucket-browser',
    label: 'S3 bucket browser',
    title: 'S3 bucket browser in your browser: preview, upload, delete',
    description:
      'Browse a bucket on AWS S3, Cloudflare R2, MinIO or another S3-compatible service: folders, previews of images, video, PDF and text, uploads, downloads and deletes. Free, with the limits listed.',
    eyebrow: 'Chapter 13 · Storage',
    h1: 'Browse an S3 bucket from a browser tab',
    lede: 'Next to PostgreSQL, pgquery connects to one S3 bucket at a time and shows it as folders and files, with previews. This page lists what it does and, just as important, what it does not.',
    body: `
<h2>What you can do</h2>
<ul>
  <li>Open folders (keys are grouped by <code>/</code>), filter the current folder and load more when it holds over 1,000 objects.</li>
  <li>Preview images, video (it seeks), audio, PDF and text or source code. Fonts and archives show their details only. A large text file asks before it loads and is not previewed above 10 MB.</li>
  <li>Download any object.</li>
  <li>Upload files into the open folder, create a folder, and delete objects or whole folders. Deleting asks first and says how many objects it will remove.</li>
  <li>See the bucket's object count and total size under Bucket Info.</li>
</ul>
<h2>Connect a bucket</h2>
<p>Choose <strong>S3</strong> in the new connection dialog and fill in five fields:</p>
<ul>
  <li><strong>Endpoint URL</strong>. AWS S3: <code>https://s3.&lt;region&gt;.amazonaws.com</code>. Cloudflare R2: <code>https://&lt;account-id&gt;.r2.cloudflarestorage.com</code>. MinIO or MaxIO: the server's address, such as <code>http://host:9000</code>.</li>
  <li><strong>Access key</strong> and <strong>secret key</strong>. Use a key limited to this bucket: it is saved in your browser.</li>
  <li><strong>Bucket</strong> and <strong>region</strong>. The region defaults to <code>us-east-1</code>; AWS needs the bucket's real region and R2 uses <code>auto</code>.</li>
</ul>
<p>Test connection checks that the bucket exists and that the key can reach it. Without a bucket at hand, open the <a href="/app/?demo=s3">read-only sample bucket</a>.</p>
<h2>What it does not do</h2>
<ul>
  <li>One bucket per connection. It does not list, create or delete buckets.</li>
  <li>Access keys only: no session tokens, no IAM roles. Requests use Signature V4 and path-style addressing, so the service has to accept path-style requests.</li>
  <li>Uploads are one request per file, with no resume and no multipart upload. A self-hosted instance accepts files up to <code>MAX_UPLOAD_MB</code>, 100 by default; the hosted app has a limit of its own. Every file passes through the pgquery server on its way, so very large files belong in the AWS CLI or rclone.</li>
  <li>A delete removes up to 10,000 objects at a time. Larger folders need the AWS CLI or a lifecycle rule.</li>
  <li>No rename, copy or move. No editing of metadata or tags. No versioning, ACLs, bucket policies or lifecycle rules.</li>
  <li>The filter only matches what is loaded in the open folder.</li>
  <li>Bucket Info stops counting at 100,000 objects or after 20 seconds, and says so.</li>
</ul>
<p>pgquery's tests run against an S3 emulator. AWS S3, R2 and MinIO speak the same protocol, but if a service behaves differently, please <a href="${ISSUES}">open an issue</a> with the service name.</p>
<h2>Where your keys and files go</h2>
<p>Connections, keys included, are saved in your browser's localStorage. Every request carries them to the pgquery server, which talks to the bucket and returns the result. Previews and downloads use a link that expires after an hour, so the keys never appear in a URL. Files pass through the server without being kept; its code does not log keys or file contents.</p>
<p>The hosted app only reaches buckets on the public internet. For MinIO on localhost or storage inside a private network, <a href="/self-hosted-postgres-gui-docker/">run pgquery yourself</a> next to it.</p>`,
    faq: [
      ['Which services does the S3 browser work with?', 'Services that speak the S3 API and accept path-style requests with Signature V4: AWS S3, Cloudflare R2, MinIO and similar. pgquery is tested against an S3 emulator, so report any service that misbehaves.'],
      ['Can I upload large files?', 'Up to the server limit: 100 MB by default on a self-hosted instance, set with MAX_UPLOAD_MB. Uploads are a single request with no resume, so use the AWS CLI or rclone for anything bigger.'],
      ['Are my S3 keys safe?', 'They stay in your browser and travel with each request to the pgquery server, which does not log or store them. Use a key limited to one bucket, and self-host if the keys must not leave your network.'],
      ['Can it delete a folder?', 'Yes. S3 has no real folders, so pgquery deletes every object under the prefix, after showing how many that is. It refuses more than 10,000 objects at once.'],
    ],
  },
  {
    slug: 'postgres-gui-in-browser',
    label: 'Postgres GUI in the browser',
    title: 'Postgres GUI in your browser — free and open source',
    description:
      'A free PostgreSQL GUI you open in the browser and connect to your live database: SQL editor, table editor, ER diagram, roles, RLS and advisors. Nothing to install.',
    eyebrow: 'Guide · Getting started',
    h1: 'A Postgres GUI that runs in your browser',
    lede: 'pgquery gives you a full PostgreSQL client in a browser tab. Open it, paste a connection string and work on your live database. Nothing to install, no account, and your connections stay in your browser.',
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
<h2>Open it</h2>
<p>Go to <a href="/app/">the app</a> and paste a connection string. Both <code>postgres://user:pass@host:5432/db</code> URIs and Npgsql / ADO.NET style key=value strings (<code>Host=…;Database=…</code>) work. To look around first, open the <a href="/app/?demo">read-only sample database</a>.</p>
<h2>How it works</h2>
<p>The interface is a single-page app. A small Go proxy turns HTTP requests from your browser into Postgres connections, runs the query and returns rows. ${DATA_NOTE}</p>
<p>${HOSTED_LIMITS}</p>
<h2>Or run your own</h2>
${run}
<p>Then open <code>http://localhost:${PORT}</code>. See the <a href="/self-hosted-postgres-gui-docker/">self-hosting guide</a> for Compose, settings and access control.</p>
<h2>When a browser client is the right choice</h2>
<p>A browser client shines when you work from several machines, can't install software on the one in front of you, or want to give a teammate the same tool without setting anything up. For a database inside a private network, run pgquery next to it, behind your VPN or reverse proxy, and everyone gets one URL.</p>`,
    faq: [
      ['Is pgquery free?', 'Yes. It is MIT licensed, free to use, modify and self-host, with no paid tier.'],
      ['Does my data pass through a third party?', 'On pgquery.dev, each query goes from your browser through the pgquery server to your database; the server is stateless and its code does not log or store queries or connection strings. When you self-host, queries go from your browser to your own container to your database.'],
      ['Which Postgres versions work?', 'Any server reachable over the normal wire protocol. Catalog queries use standard pg_catalog views.'],
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
      'Run pgquery on your own server with one docker run: for databases in a private network, your own limits, or traffic that stays inside your network. Configuration, reverse proxy and security notes.',
    eyebrow: 'Chapter 14 · Self-hosting',
    h1: 'Self-host a Postgres GUI with one Docker command',
    lede: 'The quickest way to use pgquery is the hosted app. Run your own copy when your database sits in a private network or on localhost, when you want your own limits, or when queries should not leave your network. It is one image: a Go binary that serves the app and proxies queries.',
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
  <li><code>MAX_UPLOAD_MB</code>: largest file the S3 browser uploads, default 100.</li>
  <li><code>DEMO_DATABASE_URL</code>: run a public demo. pgquery seeds a sample database, serves it read-only and resets it daily (<code>DEMO_RESET_INTERVAL</code>). Instances with a demo also refuse private and local addresses.</li>
  <li><code>DEMO_S3_ENDPOINT</code>, <code>DEMO_S3_ACCESS_KEY</code>, <code>DEMO_S3_SECRET_KEY</code>: the same for a sample bucket. Give it a dedicated bucket (<code>DEMO_S3_BUCKET</code>): the seed removes everything that is not part of the sample.</li>
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

export const GUIDES: Guide[] = [...COMPARE_GUIDES, ...CONNECT_GUIDES, ...CORE_GUIDES]

export const HOME_FAQ: [string, string][] = [
  ['What is pgquery?', 'A free, open-source client for remote data that you open in your browser: a PostgreSQL studio (SQL editor, table editor, ER diagram, RLS policies, roles, indexes, an EXPLAIN plan viewer, performance and security advisors) and an S3 bucket browser in one tab. You connect your live database or bucket; nothing is installed.'],
  ['Where are my connection strings stored?', DATA_NOTE],
  ['Is it really free?', 'Yes. MIT licensed, no paid tier, no account.'],
  ['Can it browse S3 buckets?', 'Yes, one bucket per connection on AWS S3, Cloudflare R2, MinIO or another S3-compatible service: folders, previews, upload, download and delete. It has no multipart upload, versioning or bucket management; see the S3 guide for the full list.'],
  ['Does it work with RDS, Supabase, Neon or a VPS?', 'Yes. The hosted app reaches any PostgreSQL server on the public internet. For a database in a private network or on localhost, self-host pgquery next to it.'],
  ['What are the limits on pgquery.dev?', HOSTED_LIMITS],
  ['Something is broken, missing or too limited. Where do I say so?', `Open a GitHub issue at ${ISSUES}; a link and a short description is plenty. That goes for bugs, missing features, hosted limits that get in your way, or interest in more than the free app offers. pgquery is a personal project, so feedback is very welcome.`],
  ['How do I self-host it?', `Run ${DOCKER_RUN} and open http://localhost:${PORT}. It has no login of its own, so put a shared instance behind a VPN or an authenticating proxy.`],
  ['How is it different from pgweb?', 'pgweb is a lean, mature query explorer shipped as one binary, with SSH tunnels. pgquery adds the administration side (RLS policies, roles, indexes, functions, triggers, extensions, settings), advisors, a visual EXPLAIN tree and an ER diagram; it has no SSH tunnels yet.'],
  ['Is pgquery related to the pg_query parser library?', 'No. pg_query by pganalyze is a Postgres query parser for developers; pgquery is a database GUI.'],
]
