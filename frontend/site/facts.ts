// Single source for facts repeated across the site, README-style copy and llms.txt.
export const REPO = 'https://github.com/Hxndrik/pgquery'
export const IMAGE = 'ghcr.io/hxndrik/pgquery'
export const PORT = 54280
export const DOCKER_RUN = `docker run -p ${PORT}:${PORT} ${IMAGE}`
export const ONE_LINER =
  'pgquery is a free, open-source Postgres studio that runs in your browser. It ships as one Docker container and needs no account.'
export const DESCRIPTION =
  'Free, open-source PostgreSQL GUI in your browser: SQL editor, table editor, ER diagram, RLS policies, roles, indexes, EXPLAIN plan viewer and performance advisors. One Docker container, no account.'

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
  { name: 'S3 browser', what: 'Browse, preview, upload and delete objects in any S3-compatible bucket.' },
]
