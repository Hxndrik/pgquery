import { errors } from './compare'
import { DOCKER_RUN, PORT } from './facts'
import type { Guide } from './content'

// Connection guides: where to find the connection string, which variant to use
// with pgquery, and the errors people actually hit.

const hostedNote = `<p>The hosted app at pgquery.dev reaches databases on the public internet. For a database inside a private network, run your own copy of pgquery next to it:</p>
<pre><code>${DOCKER_RUN}</code></pre>`

export const CONNECT_GUIDES: Guide[] = [
  {
    slug: 'connect-supabase',
    label: 'Connect to Supabase',
    title: 'Connect to a Supabase database with pgquery',
    description:
      'Find your Supabase connection string, pick the right one (session pooler, port 5432) and connect pgquery to your Supabase Postgres database. Common errors and fixes.',
    eyebrow: 'Guide · Connect',
    h1: 'Connect pgquery to Supabase',
    lede: 'Supabase databases are regular PostgreSQL. You need one connection string from the dashboard; the only trick is choosing the right one.',
    body: `
<h2>1. Copy the connection string</h2>
<ol>
  <li>Open your project at <a href="https://supabase.com/dashboard">supabase.com/dashboard</a>.</li>
  <li>Click <strong>Connect</strong> at the top of the page.</li>
  <li>Under <strong>Connection string</strong>, choose <strong>Session pooler</strong>.</li>
  <li>Copy the URI and replace <code>[YOUR-PASSWORD]</code> with your database password (Project Settings → Database if you need to reset it).</li>
</ol>
<p>It looks like this:</p>
<pre><code>postgresql://postgres.abcdefghijkl:YOUR-PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require</code></pre>
<h2>2. Paste it into pgquery</h2>
<p>Open <a href="/app/">the app</a>, paste the string into the connection form and press Connect. Your tables are under the <code>public</code> schema; Supabase's own schemas (<code>auth</code>, <code>storage</code>) are listed too.</p>
<h2>Which string to use</h2>
<ul>
  <li><strong>Session pooler, port 5432</strong>: use this one. It works over IPv4 and supports everything pgquery does.</li>
  <li><strong>Direct connection</strong> (<code>db.&lt;ref&gt;.supabase.co</code>): IPv6 only unless you bought the IPv4 add-on, so it often fails from Docker and many servers.</li>
  <li><strong>Transaction pooler, port 6543</strong>: avoid. It doesn't keep prepared statements between queries, which pgquery uses.</li>
</ul>
<h2>Common errors</h2>
${errors([
  ['dial tcp [2a05:…]:5432: connect: network is unreachable', 'You used the direct connection, which is IPv6-only. Switch to the session pooler string.'],
  ['prepared statement "stmtcache_…" already exists (SQLSTATE 42P05)', 'You used the transaction pooler (port 6543). Use the session pooler on port 5432.'],
  ['password authentication failed for user "postgres"', 'Check the password, and that the user is postgres.<your-project-ref> for the pooler.'],
  ['Tenant or user not found', 'The project ref in the user name or the region in the host is wrong. Copy the string again from Connect.'],
])}
<h2>Good practice</h2>
<p>For day-to-day browsing, create a role with only the rights you need instead of using <code>postgres</code>. Remember that the <code>postgres</code> role bypasses Row Level Security, so what you see is not what your app's users see. Test policies with <code>SET ROLE authenticated;</code> in the SQL editor.</p>`,
    faq: [
      ['Does pgquery work with Supabase?', 'Yes. Supabase databases are standard PostgreSQL; connect with the session pooler connection string.'],
      ['Why does the direct connection fail?', 'Supabase direct connections use IPv6 unless you add the IPv4 add-on. The session pooler works over IPv4.'],
    ],
  },
  {
    slug: 'connect-neon',
    label: 'Connect to Neon',
    title: 'Connect to a Neon Postgres database with pgquery',
    description:
      'Find your Neon connection string, choose pooled or direct, and connect pgquery to Neon serverless Postgres. Cold starts, SSL and common errors explained.',
    eyebrow: 'Guide · Connect',
    h1: 'Connect pgquery to Neon',
    lede: 'Neon gives you a standard Postgres connection string. Copy it from the dashboard, paste it into pgquery, and you are in.',
    body: `
<h2>1. Copy the connection string</h2>
<ol>
  <li>Open your project at <a href="https://console.neon.tech">console.neon.tech</a>.</li>
  <li>Click <strong>Connect</strong> on the project dashboard.</li>
  <li>Pick the branch, database and role.</li>
  <li>Turn <strong>Connection pooling</strong> off for the direct connection (recommended for pgquery), then copy the string.</li>
</ol>
<pre><code>postgresql://neondb_owner:YOUR-PASSWORD@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require</code></pre>
<h2>2. Paste it into pgquery</h2>
<p>Open <a href="/app/">the app</a>, paste the string and press Connect.</p>
<h2>Things to know</h2>
<ul>
  <li><strong>Cold starts.</strong> A Neon compute that scaled to zero takes a moment to wake up. If the first connect times out, press Connect again.</li>
  <li><strong>Pooled vs direct.</strong> The pooled host (with <code>-pooler</code> in its name) is meant for apps with many short connections. pgquery opens one connection per request, so the direct host is the simpler choice.</li>
  <li><strong>SSL is required.</strong> Keep <code>sslmode=require</code> in the string.</li>
  <li><strong>Branches.</strong> Each Neon branch has its own host. Save one pgquery connection per branch to compare them side by side.</li>
</ul>
<h2>Common errors</h2>
${errors([
  ['i/o timeout  (or: context deadline exceeded)', 'The compute was waking up. Try again; it connects fast once it is running.'],
  ['password authentication failed', 'Reset the role password in the Neon console (Roles) and copy a fresh string.'],
  ['… channel_binding …', 'Remove the channel_binding=require parameter from the string and connect again.'],
])}`,
    faq: [
      ['Does pgquery work with Neon?', 'Yes. Neon is standard PostgreSQL; paste the connection string from the Connect dialog.'],
      ['Should I use the pooled connection?', 'Use the direct connection. pgquery makes a few short-lived connections, which the direct host handles fine.'],
    ],
  },
  {
    slug: 'connect-aws-rds',
    label: 'Connect to Amazon RDS',
    title: 'Connect to Amazon RDS / Aurora PostgreSQL with pgquery',
    description:
      'Connect pgquery to Amazon RDS for PostgreSQL or Aurora: find the endpoint, open the security group, use SSL, and run pgquery inside the VPC for private databases.',
    eyebrow: 'Guide · Connect',
    h1: 'Connect pgquery to Amazon RDS',
    lede: 'RDS and Aurora are PostgreSQL behind an AWS endpoint. The work is mostly networking: pgquery has to be allowed to reach the database.',
    body: `
<h2>1. Find the endpoint</h2>
<ol>
  <li>In the AWS console, open <strong>RDS → Databases</strong> and select your instance (or the Aurora cluster's writer).</li>
  <li>On <strong>Connectivity &amp; security</strong>, copy the <strong>Endpoint</strong> and <strong>Port</strong>.</li>
</ol>
<pre><code>postgres://myuser:YOUR-PASSWORD@mydb.abc123xyz.eu-central-1.rds.amazonaws.com:5432/postgres?sslmode=require</code></pre>
<h2>2. Let pgquery reach it</h2>
<ul>
  <li><strong>Private database (most setups):</strong> run pgquery inside the same VPC, for example on an EC2 instance or as an ECS task, and connect to the endpoint from there.</li>
  <li><strong>Publicly accessible database:</strong> add an inbound rule to the instance's security group for port 5432 from the IP address pgquery runs on. Never open it to <code>0.0.0.0/0</code>.</li>
</ul>
${hostedNote}
<h2>Common errors</h2>
${errors([
  ['i/o timeout  (or: context deadline exceeded)', 'The security group or network blocks the connection. Allow port 5432 from pgquery’s address, or run pgquery inside the VPC.'],
  ['no pg_hba.conf entry for host … no encryption', 'The server requires SSL. Add sslmode=require to the connection string.'],
  ['password authentication failed', 'Check the user and password; for IAM authentication, generate a token and use it as the password (tokens expire after 15 minutes).'],
])}
<h2>Not supported (yet)</h2>
<p>pgquery has no SSH tunnel. If you normally reach RDS through a bastion host, run pgquery on that host or inside the VPC instead.</p>`,
    faq: [
      ['Does pgquery work with Aurora PostgreSQL?', 'Yes. Use the cluster writer endpoint, or a reader endpoint for read-only browsing.'],
      ['Can I connect through an SSH bastion?', 'Not directly. Run pgquery inside the VPC or on the bastion host.'],
    ],
  },
  {
    slug: 'connect-local-postgres',
    label: 'Connect to local or Docker Postgres',
    title: 'Connect pgquery to a local or Docker PostgreSQL',
    description:
      'Connect pgquery running in Docker to PostgreSQL on your machine or in another container: host.docker.internal, Docker networks, Compose and listen_addresses.',
    eyebrow: 'Guide · Connect',
    h1: 'Connect to a Postgres on your machine or in Docker',
    lede: 'Inside a container, localhost means the container itself, not your computer. That is the one thing to get right.',
    body: `
<h2>Postgres installed on your computer</h2>
<p>Start pgquery and point it at <code>host.docker.internal</code>:</p>
<pre><code>docker run -p ${PORT}:${PORT} --add-host=host.docker.internal:host-gateway ghcr.io/hxndrik/pgquery</code></pre>
<pre><code>postgres://postgres:YOUR-PASSWORD@host.docker.internal:5432/postgres</code></pre>
<p>On Docker Desktop (macOS, Windows) <code>host.docker.internal</code> works without the <code>--add-host</code> flag; on Linux the flag adds it.</p>
<h2>Postgres in Docker Compose</h2>
<p>Put both in one Compose file and use the service name as the host:</p>
<pre><code>services:
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: example
  pgquery:
    image: ghcr.io/hxndrik/pgquery
    ports:
      - "${PORT}:${PORT}"</code></pre>
<pre><code>postgres://postgres:example@db:5432/postgres</code></pre>
<h2>Common errors</h2>
${errors([
  ['dial tcp 127.0.0.1:5432: connect: connection refused', 'localhost inside the container is the container. Use host.docker.internal or the Compose service name.'],
  ['dial tcp …:5432: connect: connection refused (with host.docker.internal)', 'Postgres only listens on 127.0.0.1. Set listen_addresses = \'*\' in postgresql.conf (or start the container with -p 5432:5432) and allow the Docker network in pg_hba.conf.'],
  ['this server does not connect to private or local addresses', 'You are on a public instance (like pgquery.dev) that blocks private addresses. Run pgquery yourself to reach local databases.'],
])}`,
    faq: [
      ['Why can’t pgquery.dev connect to my local database?', 'The hosted app runs on a server on the internet, so it cannot reach your computer, and public instances block private addresses. Run pgquery locally with one docker run.'],
      ['Does pgquery work without Docker?', 'Yes. Build it from source with Node and Go; see the README.'],
    ],
  },
]
