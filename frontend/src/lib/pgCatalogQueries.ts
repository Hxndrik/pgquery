export interface CatalogQuery {
  query: string
  params?: unknown[]
}

// ---------------------------------------------------------------------------
// 1. Functions
// ---------------------------------------------------------------------------

export function listFunctions(): CatalogQuery {
  return {
    query: `
SELECT
  p.proname AS name,
  n.nspname AS schema,
  pg_get_function_identity_arguments(p.oid) AS args,
  format_type(p.prorettype, NULL) AS return_type,
  l.lanname AS language,
  CASE p.provolatile
    WHEN 'i' THEN 'immutable'
    WHEN 's' THEN 'stable'
    WHEN 'v' THEN 'volatile'
  END AS volatility,
  p.prosecdef AS security_definer,
  pg_get_functiondef(p.oid) AS definition
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_language l ON l.oid = p.prolang
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, p.proname`,
  }
}

// ---------------------------------------------------------------------------
// 2. Triggers
// ---------------------------------------------------------------------------

export function listTriggers(): CatalogQuery {
  return {
    query: `
SELECT
  t.tgname AS name,
  c.relname AS table_name,
  n.nspname AS schema,
  pg_get_triggerdef(t.oid) AS definition,
  CASE
    WHEN t.tgenabled = 'O' THEN 'enabled'
    WHEN t.tgenabled = 'D' THEN 'disabled'
    WHEN t.tgenabled = 'R' THEN 'replica'
    WHEN t.tgenabled = 'A' THEN 'always'
  END AS enabled
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, c.relname, t.tgname`,
  }
}

// ---------------------------------------------------------------------------
// 3. Enum Types
// ---------------------------------------------------------------------------

export function listEnumTypes(): CatalogQuery {
  return {
    query: `
SELECT
  n.nspname AS schema,
  t.typname AS name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
FROM pg_catalog.pg_type t
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
JOIN pg_catalog.pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
GROUP BY n.nspname, t.typname
ORDER BY n.nspname, t.typname`,
  }
}

// ---------------------------------------------------------------------------
// 4. Extensions
// ---------------------------------------------------------------------------

export function listAvailableExtensions(): CatalogQuery {
  return {
    query: `
SELECT
  name,
  default_version,
  installed_version,
  comment
FROM pg_available_extensions
ORDER BY name`,
  }
}

export function listInstalledExtensions(): CatalogQuery {
  return {
    query: `
SELECT
  e.extname AS name,
  e.extversion AS version,
  n.nspname AS schema,
  e.extrelocatable AS relocatable
FROM pg_catalog.pg_extension e
JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
ORDER BY e.extname`,
  }
}

// ---------------------------------------------------------------------------
// 5. Indexes
// ---------------------------------------------------------------------------

export function listIndexes(): CatalogQuery {
  return {
    query: `
SELECT
  sn.nspname AS schema,
  ct.relname AS table_name,
  ci.relname AS index_name,
  pg_get_indexdef(i.indexrelid) AS definition,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS size,
  am.amname AS index_type,
  i.indisunique AS is_unique,
  COALESCE(s.idx_scan, 0) AS idx_scan,
  COALESCE(s.idx_tup_read, 0) AS idx_tup_read,
  COALESCE(s.idx_tup_fetch, 0) AS idx_tup_fetch
FROM pg_catalog.pg_index i
JOIN pg_catalog.pg_class ci ON ci.oid = i.indexrelid
JOIN pg_catalog.pg_class ct ON ct.oid = i.indrelid
JOIN pg_catalog.pg_namespace sn ON sn.oid = ct.relnamespace
JOIN pg_catalog.pg_am am ON am.oid = ci.relam
LEFT JOIN pg_catalog.pg_stat_user_indexes s
  ON s.indexrelid = i.indexrelid
WHERE sn.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY sn.nspname, ct.relname, ci.relname`,
  }
}

// ---------------------------------------------------------------------------
// 6. Publications
// ---------------------------------------------------------------------------

export function listPublications(): CatalogQuery {
  return {
    query: `
SELECT
  p.pubname AS name,
  p.puballtables AS all_tables,
  p.pubinsert AS insert,
  p.pubupdate AS update,
  p.pubdelete AS delete,
  p.pubtruncate AS truncate,
  array_agg(DISTINCT n.nspname || '.' || c.relname) FILTER (WHERE c.relname IS NOT NULL) AS tables
FROM pg_catalog.pg_publication p
LEFT JOIN pg_catalog.pg_publication_rel pr ON pr.prpubid = p.oid
LEFT JOIN pg_catalog.pg_class c ON c.oid = pr.prrelid
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
GROUP BY p.oid, p.pubname, p.puballtables, p.pubinsert, p.pubupdate, p.pubdelete, p.pubtruncate
ORDER BY p.pubname`,
  }
}

// ---------------------------------------------------------------------------
// 7. Roles
// ---------------------------------------------------------------------------

export function listRoles(): CatalogQuery {
  return {
    query: `
SELECT
  r.rolname AS name,
  r.rolsuper AS superuser,
  r.rolcreatedb AS createdb,
  r.rolcreaterole AS createrole,
  r.rolcanlogin AS login,
  r.rolreplication AS replication,
  r.rolconnlimit AS connlimit,
  r.rolvaliduntil AS validuntil,
  array_agg(gr.rolname) FILTER (WHERE gr.rolname IS NOT NULL) AS member_of
FROM pg_catalog.pg_roles r
LEFT JOIN pg_catalog.pg_auth_members m ON m.member = r.oid
LEFT JOIN pg_catalog.pg_roles gr ON gr.oid = m.roleid
GROUP BY r.oid, r.rolname, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
         r.rolcanlogin, r.rolreplication, r.rolconnlimit, r.rolvaliduntil
ORDER BY r.rolname`,
  }
}

// ---------------------------------------------------------------------------
// 8. RLS Policies
// ---------------------------------------------------------------------------

export function listPoliciesForTable(schema: string, table: string): CatalogQuery {
  return {
    query: `
SELECT
  pol.polname AS name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END AS command,
  pol.polpermissive AS permissive,
  pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
  pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr,
  array_agg(r.rolname) FILTER (WHERE r.rolname IS NOT NULL) AS roles
FROM pg_catalog.pg_policy pol
JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_roles r ON r.oid = ANY(pol.polroles)
WHERE n.nspname = $1
  AND c.relname = $2
GROUP BY pol.polname, pol.polcmd, pol.polpermissive, pol.polqual, pol.polwithcheck, pol.polrelid
ORDER BY pol.polname`,
    params: [schema, table],
  }
}

export function listRlsStatusPerTable(): CatalogQuery {
  return {
    query: `
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, c.relname`,
  }
}

// ---------------------------------------------------------------------------
// 9. Settings
// ---------------------------------------------------------------------------

export function listSettings(): CatalogQuery {
  return {
    query: `
SELECT
  name,
  setting,
  unit,
  category,
  short_desc,
  context,
  vartype,
  min_val,
  max_val,
  enumvals,
  boot_val,
  reset_val
FROM pg_catalog.pg_settings
ORDER BY category, name`,
  }
}

// ---------------------------------------------------------------------------
// 10. Constraints
// ---------------------------------------------------------------------------

export function listConstraintsForSchema(schema: string): CatalogQuery {
  return {
    query: `
SELECT
  c.conname AS name,
  CASE c.contype
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
  END AS type,
  rel.relname AS table_name,
  n.nspname AS schema,
  pg_get_constraintdef(c.oid, true) AS definition
FROM pg_catalog.pg_constraint c
JOIN pg_catalog.pg_class rel ON rel.oid = c.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = $1
  AND c.contype IN ('f', 'p', 'u', 'c')
ORDER BY rel.relname, c.contype, c.conname`,
    params: [schema],
  }
}

// ---------------------------------------------------------------------------
// 11. Table Detail
// ---------------------------------------------------------------------------

export function getTableDetail(schema: string, table: string): CatalogQuery {
  return {
    query: `
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
  pg_size_pretty(pg_indexes_size(c.oid)) AS indexes_size,
  c.reltuples::bigint AS row_estimate,
  d.description,
  c.relrowsecurity AS rls_enabled,
  c.relkind AS kind
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_description d
  ON d.objoid = c.oid AND d.objsubid = 0
WHERE n.nspname = $1
  AND c.relname = $2`,
    params: [schema, table],
  }
}

// ---------------------------------------------------------------------------
// 12. Foreign Keys for ER Diagram
// ---------------------------------------------------------------------------

export function listForeignKeyRelationships(): CatalogQuery {
  return {
    query: `
SELECT
  sn.nspname AS source_schema,
  sc.relname AS source_table,
  sa.attname AS source_column,
  tn.nspname AS target_schema,
  tc.relname AS target_table,
  ta.attname AS target_column,
  con.conname AS constraint_name
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class sc ON sc.oid = con.conrelid
JOIN pg_catalog.pg_namespace sn ON sn.oid = sc.relnamespace
JOIN pg_catalog.pg_class tc ON tc.oid = con.confrelid
JOIN pg_catalog.pg_namespace tn ON tn.oid = tc.relnamespace
JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS uk(attnum, ord) ON true
JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS fk(attnum, ord) ON uk.ord = fk.ord
JOIN pg_catalog.pg_attribute sa ON sa.attrelid = con.conrelid AND sa.attnum = uk.attnum
JOIN pg_catalog.pg_attribute ta ON ta.attrelid = con.confrelid AND ta.attnum = fk.attnum
WHERE con.contype = 'f'
  AND sn.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY sn.nspname, sc.relname, con.conname, uk.ord`,
  }
}

// ---------------------------------------------------------------------------
// 13. Security Checks
// ---------------------------------------------------------------------------

export function tablesWithoutRls(): CatalogQuery {
  return {
    query: `
SELECT
  n.nspname AS schema,
  c.relname AS table_name
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND NOT c.relrowsecurity
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, c.relname`,
  }
}

export function superuserRoles(): CatalogQuery {
  return {
    query: `
SELECT rolname AS name
FROM pg_catalog.pg_roles
WHERE rolsuper
ORDER BY rolname`,
  }
}

export function publicSchemaTables(): CatalogQuery {
  return {
    query: `
SELECT
  c.relname AS table_name,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
  END AS type
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'v', 'm')
ORDER BY c.relname`,
  }
}

// ---------------------------------------------------------------------------
// 14. Performance Checks
// ---------------------------------------------------------------------------

export function unusedIndexes(): CatalogQuery {
  return {
    query: `
SELECT
  s.schemaname AS schema,
  s.relname AS table_name,
  s.indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(s.indexrelid)) AS size,
  s.idx_scan
FROM pg_catalog.pg_stat_user_indexes s
JOIN pg_catalog.pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisunique
  AND NOT i.indisprimary
ORDER BY pg_relation_size(s.indexrelid) DESC`,
  }
}

export function tableBloat(): CatalogQuery {
  return {
    query: `
SELECT
  schemaname AS schema,
  relname AS table_name,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  CASE WHEN n_live_tup > 0
    THEN round(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0
  END AS dead_ratio_pct,
  last_autovacuum,
  last_autoanalyze
FROM pg_catalog.pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY n_dead_tup DESC`,
  }
}

export function cacheHitRatio(): CatalogQuery {
  return {
    query: `
SELECT
  sum(heap_blks_hit) AS heap_hit,
  sum(heap_blks_read) AS heap_read,
  CASE WHEN sum(heap_blks_hit) + sum(heap_blks_read) > 0
    THEN round(100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2)
    ELSE 0
  END AS hit_ratio_pct
FROM pg_catalog.pg_statio_user_tables`,
  }
}

export function seqScanStats(): CatalogQuery {
  return {
    query: `
SELECT
  schemaname AS schema,
  relname AS table_name,
  seq_scan,
  seq_tup_read,
  idx_scan,
  CASE WHEN seq_scan + COALESCE(idx_scan, 0) > 0
    THEN round(100.0 * seq_scan / (seq_scan + COALESCE(idx_scan, 0)), 2)
    ELSE 0
  END AS seq_scan_pct
FROM pg_catalog.pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC`,
  }
}

// ---------------------------------------------------------------------------
// 15. Query Performance (pg_stat_statements)
// ---------------------------------------------------------------------------

export function checkStatStatementsExtension(): CatalogQuery {
  return {
    query: `
SELECT installed_version IS NOT NULL AS installed
FROM pg_available_extensions
WHERE name = 'pg_stat_statements'`,
  }
}

export function topQueriesByTime(limit: number = 20): CatalogQuery {
  return {
    query: `
SELECT
  queryid,
  query,
  calls,
  round(total_exec_time::numeric, 2) AS total_time_ms,
  round(mean_exec_time::numeric, 2) AS mean_time_ms,
  round(stddev_exec_time::numeric, 2) AS stddev_time_ms,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT $1`,
    params: [limit],
  }
}

// ---------------------------------------------------------------------------
// 16. Replication
// ---------------------------------------------------------------------------

export function listReplicationSlots(): CatalogQuery {
  return {
    query: `
SELECT
  slot_name,
  plugin,
  slot_type,
  database,
  active,
  restart_lsn,
  confirmed_flush_lsn
FROM pg_catalog.pg_replication_slots
ORDER BY slot_name`,
  }
}

export function listSubscriptions(): CatalogQuery {
  return {
    query: `
SELECT
  s.subname AS name,
  s.subenabled AS enabled,
  s.subconninfo AS conninfo,
  s.subpublications AS publications,
  s.subslotname AS slot_name
FROM pg_catalog.pg_subscription s
ORDER BY s.subname`,
  }
}

// ---------------------------------------------------------------------------
// 17. Foreign Data Wrappers
// ---------------------------------------------------------------------------

export function listForeignServers(): CatalogQuery {
  return {
    query: `
SELECT
  s.srvname AS name,
  w.fdwname AS wrapper,
  s.srvoptions AS options
FROM pg_catalog.pg_foreign_server s
JOIN pg_catalog.pg_foreign_data_wrapper w ON w.oid = s.srvfdw
ORDER BY s.srvname`,
  }
}

export function listForeignTables(): CatalogQuery {
  return {
    query: `
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  s.srvname AS server,
  ft.ftoptions AS options
FROM pg_catalog.pg_foreign_table ft
JOIN pg_catalog.pg_class c ON c.oid = ft.ftrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_foreign_server s ON s.oid = ft.ftserver
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, c.relname`,
  }
}

// ---------------------------------------------------------------------------
// 18. Schemas List
// ---------------------------------------------------------------------------

export function listSchemas(): CatalogQuery {
  return {
    query: `
SELECT
  n.nspname AS name,
  r.rolname AS owner,
  d.description
FROM pg_catalog.pg_namespace n
JOIN pg_catalog.pg_roles r ON r.oid = n.nspowner
LEFT JOIN pg_catalog.pg_description d
  ON d.objoid = n.oid AND d.objsubid = 0
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
ORDER BY n.nspname`,
  }
}
