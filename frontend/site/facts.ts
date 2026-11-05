// Single source for facts repeated across the site and llms.txt. README.md repeats them by hand.
export const REPO = 'https://github.com/Hxndrik/pgquery'
export const IMAGE = 'ghcr.io/hxndrik/pgquery'
export const PORT = 54280
export const DOCKER_RUN = `docker run -p ${PORT}:${PORT} ${IMAGE}`
export const ISSUES = `${REPO}/issues/new/choose`
export const ONE_LINER =
  'pgquery is a free, open-source PostgreSQL client you open in your browser. Connect your live database; connections, tabs and history stay in your browser. It also browses S3 buckets, and self-hosting is optional: one Docker container.'
export const DESCRIPTION =
  'Free, open-source PostgreSQL client in your browser: connect your live database, nothing to install. SQL editor, table editor, ER diagram, RLS policies, roles, indexes, EXPLAIN viewer, advisors and an S3 bucket browser. Connections stay in your browser; self-host as one Docker container if you prefer.'
/** What the hosted app can and cannot promise. Keep in step with proxy/connect.go and proxy/main.go. */
export const DATA_NOTE =
  'Saved connections (S3 keys included), tabs and history live in your browser (localStorage). Each query is sent with its connection string to the pgquery server, which opens a connection, runs it and returns the rows. S3 requests work the same way, and uploaded and downloaded files pass through the server without being kept. The server is stateless and open source; its code does not log or store connection strings, keys, queries or files. To keep everything inside your own network, self-host.'
export const HOSTED_LIMITS =
  'The hosted app at pgquery.dev reaches databases and buckets on the public internet only (private and local addresses are refused), and limits rows per query, query time, upload size and requests per IP. Self-host to reach private networks and set your own limits.'
export const PERSONAL_NOTE =
  'pgquery is a tool I built for my own Postgres work and decided to publish. It is free and will stay free; it is not built to make money. Expect a few rough edges. If something breaks, a feature is missing or the hosted limits get in your way, open a GitHub issue: a link and a short description is plenty.'

export const FEATURES: { name: string; what: string; slug?: string }[] = [
  { name: 'SQL Editor', what: 'Monaco editor with schema-aware autocomplete, tabs, 500-entry history, saved queries, CSV and JSON export.' },
  { name: 'EXPLAIN plan viewer', what: 'Runs EXPLAIN (FORMAT JSON) and draws the plan as a tree, flagging the slowest node and bad row estimates.', slug: 'explain-analyze-visualizer' },
  { name: 'Table Editor', what: 'Browse, sort, paginate, insert, edit and delete rows. JSONB cells open as real JSON.' },
  { name: 'Schema Map', what: 'Interactive ER diagram with every foreign key. Export it as a printable SVG or PNG plate.', slug: 'postgres-er-diagram' },
  { name: 'Policies (RLS)', what: 'Enable Row Level Security per table and create, view and drop policies.', slug: 'postgres-rls-policy-editor' },
  { name: 'Roles & Grants', what: 'Create roles, set attributes, grant and revoke membership.' },
  { name: 'Indexes', what: 'Usage statistics per index; create (btree, hash, gin, gist, brin) and drop, concurrently if you like.' },
  { name: 'Query Performance', what: 'pg_stat_statements ranked by total time, mean time or calls.', slug: 'pg-stat-statements-viewer' },
  { name: 'Performance Advisor', what: 'Cache hit ratio, unused indexes, table bloat, sequential scans, connection use.' },
  { name: 'Security Advisor', what: 'Scored audit of RLS coverage, superuser roles, public schema grants, SSL and password hashing.' },
  { name: 'Functions, triggers, enums', what: 'List, view, create and drop functions, triggers and enumerated types.' },
  { name: 'Extensions, publications, FDW', what: 'Install extensions, manage logical replication publications, browse foreign servers and tables.' },
  { name: 'Settings', what: 'Browse every PostgreSQL setting by category and change session or system values.' },
  { name: 'S3 browser', what: 'Browse a bucket on any S3-compatible service: folders, paging, previews of images, video, audio, PDF and text, downloads, uploads, new folders and recursive delete. One bucket per connection.', slug: 's3-bucket-browser' },
]
