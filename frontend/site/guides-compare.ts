import { matrix, pick, verdict, type Matrix } from './compare'
import { DOCKER_RUN, PORT } from './facts'
import type { Guide } from './content'

// Comparison pages. Rule for this file: be specific and fair. Say where other
// tools are better, and only claim what pgquery's code actually does.
// Competitor facts reflect their public docs as of November 2026.

const run = `<pre><code>${DOCKER_RUN}</code></pre>`
export const asOf = 'Checked against each project’s documentation, November 2026. Corrections welcome on GitHub.'

/** The full browser-client roundup; the home page shows a slice of it. */
export const ROUNDUP: Matrix = {
  caption: 'Web-based PostgreSQL clients',
  tools: ['pgquery', 'pgweb', 'DbGate', 'pgAdmin 4', 'CloudBeaver CE', 'Adminer', 'Supabase Studio'],
  rows: [
    { label: 'Self-hosted as', cells: ['One Go container (or use the hosted app)', 'One Go binary or container', 'Node.js server (container or npm); also desktop', 'Python web app', 'Java web app', 'One PHP file', 'Part of the Supabase stack'] },
    { label: 'Databases', cells: ['PostgreSQL', 'PostgreSQL', 'Many (some Premium)', 'PostgreSQL', 'Many', 'Many', 'PostgreSQL'] },
    { label: 'Own login and user accounts', cells: [['no', 'None needed when hosted; self-hosted, use a VPN or auth proxy'], ['partly', 'HTTP basic auth'], 'yes', 'yes', 'yes', ['partly', 'Database login only'], ['partly', 'Basic auth when self-hosted']] },
    { label: 'SSH tunnel', cells: ['no', 'yes', 'yes', 'yes', 'yes', 'no', 'no'] },
    { label: 'SQL editor with autocomplete', cells: ['yes', 'yes', 'yes', 'yes', 'yes', ['partly', 'Plain text area'], 'yes'] },
    { label: 'Edit table rows', cells: [['yes', 'Runs directly'], ['no', 'Write the UPDATE yourself'], ['yes', 'Previews the SQL'], 'yes', 'yes', 'yes', 'yes'] },
    { label: 'ER diagram', cells: [['yes', 'Exports SVG / PNG'], 'no', 'yes', 'yes', ['partly', 'Depends on edition'], ['partly', 'Basic schema view'], 'yes'] },
    { label: 'Visual EXPLAIN', cells: [['yes', 'Tree with time share'], ['partly', 'EXPLAIN as text'], 'Not in its feature list', 'yes', 'yes', ['partly', 'EXPLAIN as a table'], 'yes'] },
    { label: 'Row Level Security editor', cells: ['yes', 'no', 'Not in its feature list', 'yes', ['no', 'Write the SQL'], 'no', 'yes'] },
    { label: 'Performance and security advisors', cells: ['yes', ['partly', 'Activity and settings views'], 'no', ['partly', 'Activity dashboards'], 'no', 'no', ['yes', 'More checks than pgquery']] },
    { label: 'Backup and restore', cells: [['no', 'Use pg_dump'], ['partly', 'pg_dump export, no restore'], ['partly', 'Import / export, NDJSON archives'], 'yes', ['partly', 'Data export'], ['partly', 'SQL export / import'], ['partly', 'Platform backups']] },
    { label: 'Import CSV', cells: ['no', 'no', ['yes', 'Also Excel, JSON, XML'], 'yes', 'yes', 'yes', 'yes'] },
    { label: 'Schema compare / diff', cells: ['no', 'no', 'yes', 'yes', 'no', 'no', 'no'] },
    { label: 'PL/pgSQL debugger', cells: ['no', 'no', 'no', 'yes', 'no', 'no', 'no'] },
    { label: 'Previews SQL for schema changes', cells: [['yes', 'Every schema form'], ['no', 'No schema forms'], ['yes', 'Also for row edits'], ['yes', 'SQL tab in dialogs'], 'partly', 'partly', 'partly'] },
    { label: 'License', cells: ['MIT', 'MIT', 'GPL-3.0 (paid Premium)', 'PostgreSQL License', 'Apache 2.0', 'Apache 2.0 or GPL 2', 'Apache 2.0'] },
    { label: 'Maturity', cells: ['New (2026), one maintainer', '10+ years, small team', 'Very active, company-backed', '10+ years, PostgreSQL community', 'Mature, backed by DBeaver', 'Mature, slow-moving', 'Large company, very active'] },
  ],
  footnote: asOf,
}

export const ROUNDUP_WINS = [
    'More than a query explorer: RLS policies, roles, indexes, functions, triggers, extensions and settings, which pgweb doesn’t cover.',
    'Postgres-specific depth DbGate doesn’t focus on: Row Level Security, performance and security advisors, pg_stat_statements.',
    'EXPLAIN ANALYZE as a tree that points at the slowest node and flags bad row estimates.',
    'Nothing to install: open the hosted app and connect. Or self-host one small, stateless container; nothing is stored on the server.',
    'Schema changes made through forms (CREATE, ALTER, GRANT, policies) are shown as SQL first, and you run them yourself.',
  ]

export const ROUNDUP_LOSSES = [
    'No SSH tunnels. pgweb, DbGate, pgAdmin and CloudBeaver connect through a bastion host where pgquery cannot.',
    'No login of its own. pgweb has basic auth, DbGate, pgAdmin and CloudBeaver have accounts; a self-hosted pgquery needs a VPN or an auth proxy.',
    'PostgreSQL only. DbGate, CloudBeaver and Adminer also speak MySQL, SQLite, SQL Server and more.',
    'No backup / restore, CSV import or schema diff. DbGate and pgAdmin have them, and DbGate previews even row edits as SQL.',
    'Not a single binary: pgweb runs without Docker on Mac, Linux and Windows.',
    'It is young. pgweb and pgAdmin have more than ten years of bug reports behind them.',
  ]


export const COMPARE_GUIDES: Guide[] = [
  {
    slug: 'postgres-client-comparison',
    label: 'Browser PostgreSQL clients compared',
    title: 'Browser-based PostgreSQL clients compared (2026)',
    description:
      'An honest comparison of web-based PostgreSQL clients: pgquery, pgweb, DbGate, pgAdmin 4, CloudBeaver, Adminer and Supabase Studio. Footprint, login, SSH, ER diagrams, EXPLAIN, RLS, backups and licenses.',
    eyebrow: 'Guide · Comparison',
    h1: 'Browser-based PostgreSQL clients, compared honestly',
    lede: 'Seven tools you can open in a browser tab, side by side. pgquery is ours, so we are listing where it falls short as carefully as where it does well.',
    wide: true,
    body: `
${matrix(ROUNDUP)}
${verdict(ROUNDUP_WINS, ROUNDUP_LOSSES)}
<h2>Which one to pick</h2>
${pick([
  ['pgquery', 'You want a modern Postgres GUI you can open from any browser without installing anything, or run yourself in one command behind your own access control.'],
  ['pgweb', 'You want a lean, proven query explorer as a single binary, with SSH tunnels and no Docker.'],
  ['DbGate', 'You work with several databases and want a full-featured manager: import / export, schema compare, query designer.'],
  ['pgAdmin 4', 'You need the most complete PostgreSQL administration: backups, debugging, schema diff, many servers, user accounts.'],
  ['CloudBeaver', 'Your team works with several database engines and wants one web tool with logins for all of them.'],
  ['Adminer', 'You need something tiny on a PHP server for occasional edits, across database types.'],
  ['Supabase Studio', 'You run on Supabase. It is the best-integrated choice there, with auth, storage and functions alongside the database.'],
])}
<p>Desktop apps are a separate category: see <a href="/dbeaver-alternative/">pgquery vs DBeaver</a>.</p>`,
    faq: [
      ['Which browser-based PostgreSQL client is the best?', 'It depends on what you need. For full administration with logins, pgAdmin 4. For several database engines, DbGate or CloudBeaver. For a lean query explorer as one binary, pgweb. For Postgres administration (RLS, roles, advisors, EXPLAIN) in one small container, pgquery.'],
      ['How is pgquery different from pgweb?', 'pgweb is a lean, mature query explorer: browse tables, run SQL, export, SSH tunnels, single binary. pgquery adds the administration side (RLS policies, roles, indexes, functions, triggers, extensions, settings), performance and security advisors, a visual EXPLAIN tree and an ER diagram. pgweb wins on SSH tunnels, single binary and maturity.'],
      ['Are any of these free?', 'All five have free, open-source versions. CloudBeaver and Supabase also sell paid editions or hosting.'],
      ['Is it safe to use a web-based database client?', 'Your database credentials are what protect your data, so use a role with only the rights you need. On hosted pgquery, connections are kept in your browser and the open-source server stores nothing; if queries must not leave your network, self-host it next to your database behind a VPN or an authenticating proxy.'],
    ],
  },
  {
    slug: 'pgadmin-alternative',
    label: 'pgquery vs pgAdmin',
    title: 'pgquery vs pgAdmin: an honest comparison',
    description:
      'pgquery and pgAdmin 4 side by side: footprint, editor, EXPLAIN, ER diagrams, RLS, advisors, backups, debugger and logins. Where each one is the better choice.',
    eyebrow: 'Guide · Comparison',
    h1: 'pgquery vs pgAdmin',
    lede: 'pgAdmin is the reference PostgreSQL admin tool and covers far more ground. pgquery is smaller and faster to run, with a few screens pgAdmin doesn’t have. Here is the honest breakdown.',
    wide: true,
    body: `
${matrix({
  caption: 'pgquery and pgAdmin 4',
  tools: ['pgquery', 'pgAdmin 4'],
  rows: [
    { label: 'Runs as', cells: ['Hosted web app, or one Go container; open in any browser', 'Desktop app, or a Python web server'] },
    { label: 'Settings and saved connections', cells: [['partly', 'In your browser only'], ['yes', 'On the server, per user']] },
    { label: 'Own login and user accounts', cells: ['no', 'yes'] },
    { label: 'Many servers in one tree', cells: [['partly', 'Saved connections list'], 'yes'] },
    { label: 'SSH tunnel', cells: ['no', 'yes'] },
    { label: 'SQL editor with autocomplete', cells: [['yes', 'Monaco, schema-aware'], 'yes'] },
    { label: 'Visual EXPLAIN', cells: [['yes', 'Tree, time share, misestimates'], ['yes', 'Graphical plan']] },
    { label: 'ER diagram', cells: [['yes', 'Export as SVG / PNG plate'], ['yes', 'ERD tool, can generate SQL']] },
    { label: 'Row Level Security policies', cells: ['yes', 'yes'] },
    { label: 'Performance advisor', cells: [['yes', 'Unused indexes, bloat, cache, seq scans'], ['partly', 'Server activity dashboard']] },
    { label: 'Security advisor', cells: [['yes', 'Scored audit'], 'no'] },
    { label: 'pg_stat_statements view', cells: ['yes', ['partly', 'Via SQL']] },
    { label: 'Backup and restore (pg_dump)', cells: ['no', 'yes'] },
    { label: 'Import / export CSV', cells: [['partly', 'Export only'], 'yes'] },
    { label: 'PL/pgSQL debugger', cells: ['no', 'yes'] },
    { label: 'Schema diff', cells: ['no', 'yes'] },
    { label: 'Maintenance (VACUUM, ANALYZE, REINDEX) dialogs', cells: [['partly', 'Run them in the editor'], 'yes'] },
    { label: 'License', cells: ['MIT', 'PostgreSQL License'] },
  ],
  footnote: asOf,
})}
${verdict(
  [
    'Nothing to install: open the hosted app, or self-host in one command with no Python runtime and no settings database.',
    'A Monaco editor with tabs that survive a reload, plus history and saved queries.',
    'Performance and security advisors that tell you what to fix, not just graphs.',
    'Schema changes made through forms are shown as SQL before they run.',
  ],
  [
    'pgAdmin has user accounts; pgquery has no login of its own.',
    'Backup / restore, the PL/pgSQL debugger, schema diff and CSV import are pgAdmin-only.',
    'SSH tunnels and server groups: pgAdmin manages a whole fleet; pgquery is one database at a time.',
    'pgAdmin is maintained by the PostgreSQL community and has a decade of hardening.',
  ],
)}
<h2>Use both</h2>
<p>They don't conflict. Use pgquery for daily querying and the advisors, and keep pgAdmin around for backups and debugging. <a href="/app/">Open pgquery</a>, or run it next to pgAdmin:</p>
${run}
<p>pgquery listens on port ${PORT}.</p>`,
    faq: [
      ['Can pgquery replace pgAdmin?', 'For querying, browsing data, roles, policies, indexes and the advisors, yes. For backups, debugging, schema diff and multi-user setups, pgAdmin still does more.'],
      ['Is pgquery a fork of pgAdmin?', 'No. It is a separate project: a React frontend and a small Go proxy.'],
    ],
  },
  {
    slug: 'dbeaver-alternative',
    label: 'pgquery vs DBeaver',
    title: 'pgquery vs DBeaver for PostgreSQL: an honest comparison',
    description:
      'pgquery (browser, one container) and DBeaver (desktop) compared for PostgreSQL work: databases, SSH, import/export, ER diagrams, EXPLAIN, RLS, advisors and team use.',
    eyebrow: 'Guide · Comparison',
    h1: 'pgquery vs DBeaver',
    lede: 'DBeaver is a powerful desktop app for nearly every database. pgquery is a browser tool for PostgreSQL only. They solve different problems, and for many people DBeaver is the right answer.',
    wide: true,
    body: `
${matrix({
  caption: 'pgquery and DBeaver Community',
  tools: ['pgquery', 'DBeaver Community'],
  rows: [
    { label: 'Runs as', cells: ['Browser tab (hosted, or self-hosted container)', 'Desktop app (Java), per machine'] },
    { label: 'Install on each computer', cells: [['yes', 'Nothing to install'], ['no', 'Install and update everywhere']] },
    { label: 'Works on a tablet or a locked-down laptop', cells: ['yes', 'no'] },
    { label: 'One URL for the whole team', cells: ['yes', ['partly', 'Team features are paid']] },
    { label: 'Databases', cells: ['PostgreSQL', '100+ (MySQL, SQLite, Oracle, …)'] },
    { label: 'Works offline, local files (SQLite, CSV)', cells: ['no', 'yes'] },
    { label: 'SSH tunnel', cells: ['no', 'yes'] },
    { label: 'Data import (CSV, Excel, …)', cells: ['no', 'yes'] },
    { label: 'Export', cells: [['partly', 'CSV, JSON'], ['yes', 'Many formats']] },
    { label: 'ER diagram', cells: [['yes', 'SVG / PNG plate'], 'yes'] },
    { label: 'Visual EXPLAIN', cells: ['yes', 'yes'] },
    { label: 'Row Level Security editor', cells: ['yes', ['partly', 'Mostly via SQL']] },
    { label: 'Performance and security advisors', cells: ['yes', 'no'] },
    { label: 'Memory use', cells: [['yes', 'A browser tab'], ['partly', 'A JVM app']] },
    { label: 'License', cells: ['MIT', 'Apache 2.0 (paid Pro editions)'] },
  ],
  footnote: asOf,
})}
${verdict(
  [
    'No installs: open a URL from any machine, including ones where you can’t install software.',
    'One URL the whole team shares: the hosted app, or your own deployment next to the database.',
    'Postgres-specific screens DBeaver doesn’t focus on: RLS policies, the advisors, pg_stat_statements.',
    'Light: a browser tab instead of a Java desktop app.',
  ],
  [
    'DBeaver speaks over 100 databases; pgquery only PostgreSQL.',
    'SSH tunnels, local files, offline work and rich import/export are DBeaver strengths pgquery doesn’t have.',
    'DBeaver is far more mature and has a large user base.',
  ],
)}
<h2>Which one to pick</h2>
${pick([
  ['pgquery', 'You work with PostgreSQL, want zero installs, and like the idea of one URL your team can share.'],
  ['DBeaver', 'You work with several database engines, need SSH tunnels or local files, or prefer a desktop app.'],
])}`,
    faq: [
      ['Is pgquery a DBeaver replacement?', 'For PostgreSQL work in the browser, it can be. If you use other databases or need SSH tunnels, keep DBeaver.'],
      ['Is there a web version of DBeaver?', 'Yes, CloudBeaver. See the browser clients comparison for how it compares to pgquery.'],
    ],
  },
  {
    slug: 'supabase-studio-alternative',
    label: 'pgquery vs Supabase Studio',
    title: 'pgquery vs Supabase Studio: Studio-style screens for any Postgres',
    description:
      'pgquery and Supabase Studio compared: table editor, SQL editor, RLS policies, advisors, hosting and self-hosting. Where Studio is better, and when pgquery fits.',
    eyebrow: 'Guide · Comparison',
    h1: 'pgquery vs Supabase Studio',
    lede: 'Supabase Studio is the best dashboard for Supabase projects, and pgquery borrows its best ideas. The difference: pgquery works with any PostgreSQL, in the browser or as one container you run yourself.',
    wide: true,
    body: `
${matrix({
  caption: 'pgquery and Supabase Studio',
  tools: ['pgquery', 'Supabase Studio'],
  rows: [
    { label: 'Works with', cells: [['yes', 'Any PostgreSQL'], ['partly', 'Supabase projects']] },
    { label: 'Self-hosted as', cells: ['One container (optional; hosted app at pgquery.dev)', 'The Supabase stack (many containers)'] },
    { label: 'Table editor', cells: ['yes', ['yes', 'More polished']] },
    { label: 'SQL editor', cells: ['yes', ['yes', 'With an AI assistant']] },
    { label: 'Row Level Security policies', cells: ['yes', ['yes', 'With templates']] },
    { label: 'Schema visualizer', cells: [['yes', 'SVG / PNG plate export'], 'yes'] },
    { label: 'Security and performance advisors', cells: ['yes', ['yes', 'More checks']] },
    { label: 'Visual EXPLAIN', cells: [['yes', 'Tree with time share'], 'yes'] },
    { label: 'Auth, storage, edge functions', cells: ['no', 'yes'] },
    { label: 'Own login', cells: ['no', 'yes'] },
    { label: 'License', cells: ['MIT', 'Apache 2.0'] },
  ],
  footnote: asOf,
})}
${verdict(
  [
    'Works with RDS, Neon, Cloud SQL, a VPS or your laptop, with no Supabase project required.',
    'Open it in the browser with no project to set up, or self-host one container instead of the whole Supabase stack.',
    'Handy alongside Supabase too: compare environments or hand a teammate a read-only role.',
  ],
  [
    'On Supabase, Studio is better integrated: auth, storage, functions, logs and an AI assistant.',
    'Studio has more advisor checks and a more polished table editor.',
    'Studio has a login; a self-hosted pgquery needs your own access control.',
  ],
)}
<p>Using Supabase? See <a href="/connect-supabase/">how to connect pgquery to Supabase</a>.</p>
${run}`,
    faq: [
      ['Is pgquery affiliated with Supabase?', 'No. It is an independent open-source project.'],
      ['Does it work with Supabase databases?', 'Yes. Use the session pooler connection string; see the Supabase connection guide.'],
    ],
  },
]
