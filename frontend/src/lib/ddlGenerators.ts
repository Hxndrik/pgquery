// ---------------------------------------------------------------------------
// DDL Generators — produce SQL strings for create/alter/drop operations
// ---------------------------------------------------------------------------

function quoteIdent(name: string): string {
  if (/^[a-z_][a-z0-9_]*$/.test(name) && !RESERVED_WORDS.has(name.toUpperCase())) {
    return name
  }
  return `"${name.replace(/"/g, '""')}"`
}

function qualifiedName(schema: string | undefined, name: string): string {
  if (schema) {
    return `${quoteIdent(schema)}.${quoteIdent(name)}`
  }
  return quoteIdent(name)
}

function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/** Subset of PostgreSQL reserved words that require quoting */
const RESERVED_WORDS = new Set([
  'ALL', 'ANALYSE', 'ANALYZE', 'AND', 'ANY', 'ARRAY', 'AS', 'ASC',
  'ASYMMETRIC', 'BOTH', 'CASE', 'CAST', 'CHECK', 'COLLATE', 'COLUMN',
  'CONSTRAINT', 'CREATE', 'CURRENT_CATALOG', 'CURRENT_DATE', 'CURRENT_ROLE',
  'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER', 'DEFAULT',
  'DEFERRABLE', 'DESC', 'DISTINCT', 'DO', 'ELSE', 'END', 'EXCEPT',
  'FALSE', 'FETCH', 'FOR', 'FOREIGN', 'FROM', 'GRANT', 'GROUP', 'HAVING',
  'IN', 'INITIALLY', 'INTERSECT', 'INTO', 'LATERAL', 'LEADING', 'LIMIT',
  'LOCALTIME', 'LOCALTIMESTAMP', 'NOT', 'NULL', 'OFFSET', 'ON', 'ONLY',
  'OR', 'ORDER', 'PLACING', 'PRIMARY', 'REFERENCES', 'RETURNING', 'SELECT',
  'SESSION_USER', 'SOME', 'SYMMETRIC', 'TABLE', 'THEN', 'TO', 'TRAILING',
  'TRUE', 'UNION', 'UNIQUE', 'USER', 'USING', 'VARIADIC', 'WHEN', 'WHERE',
  'WINDOW', 'WITH',
])

// ---------------------------------------------------------------------------
// 1. Tables
// ---------------------------------------------------------------------------

export interface ColumnDef {
  name: string
  type: string
  nullable?: boolean
  defaultValue?: string
  primaryKey?: boolean
  unique?: boolean
  references?: { table: string; column: string; schema?: string }
  check?: string
}

export interface CreateTableParams {
  schema?: string
  name: string
  columns: ColumnDef[]
  ifNotExists?: boolean
}

export function createTable(params: CreateTableParams): string {
  const tableName = qualifiedName(params.schema, params.name)
  const ifne = params.ifNotExists ? ' IF NOT EXISTS' : ''
  const cols = params.columns.map((col) => {
    const parts = [quoteIdent(col.name), col.type]
    if (col.primaryKey) parts.push('PRIMARY KEY')
    if (col.unique && !col.primaryKey) parts.push('UNIQUE')
    if (col.nullable === false) parts.push('NOT NULL')
    if (col.defaultValue !== undefined) parts.push(`DEFAULT ${col.defaultValue}`)
    if (col.references) {
      parts.push(`REFERENCES ${qualifiedName(col.references.schema, col.references.table)} (${quoteIdent(col.references.column)})`)
    }
    if (col.check) parts.push(`CHECK (${col.check})`)
    return `  ${parts.join(' ')}`
  })
  return `CREATE TABLE${ifne} ${tableName} (\n${cols.join(',\n')}\n);`
}

export interface AddColumnParams {
  schema?: string
  table: string
  column: ColumnDef
  ifNotExists?: boolean
}

export function alterTableAddColumn(params: AddColumnParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const ifne = params.ifNotExists ? ' IF NOT EXISTS' : ''
  const parts = [quoteIdent(params.column.name), params.column.type]
  if (params.column.nullable === false) parts.push('NOT NULL')
  if (params.column.defaultValue !== undefined) parts.push(`DEFAULT ${params.column.defaultValue}`)
  return `ALTER TABLE ${tableName} ADD COLUMN${ifne} ${parts.join(' ')};`
}

export interface DropColumnParams {
  schema?: string
  table: string
  column: string
  ifExists?: boolean
  cascade?: boolean
}

export function alterTableDropColumn(params: DropColumnParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const ife = params.ifExists ? ' IF EXISTS' : ''
  const cascade = params.cascade ? ' CASCADE' : ''
  return `ALTER TABLE ${tableName} DROP COLUMN${ife} ${quoteIdent(params.column)}${cascade};`
}

export interface RenameColumnParams {
  schema?: string
  table: string
  oldName: string
  newName: string
}

export function alterTableRenameColumn(params: RenameColumnParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  return `ALTER TABLE ${tableName} RENAME COLUMN ${quoteIdent(params.oldName)} TO ${quoteIdent(params.newName)};`
}

export interface ChangeColumnTypeParams {
  schema?: string
  table: string
  column: string
  newType: string
  using?: string
}

export function alterTableChangeColumnType(params: ChangeColumnTypeParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const using = params.using ? ` USING ${params.using}` : ''
  return `ALTER TABLE ${tableName} ALTER COLUMN ${quoteIdent(params.column)} TYPE ${params.newType}${using};`
}

export interface DropTableParams {
  schema?: string
  name: string
  ifExists?: boolean
  cascade?: boolean
}

export function dropTable(params: DropTableParams): string {
  const tableName = qualifiedName(params.schema, params.name)
  const ife = params.ifExists ? ' IF EXISTS' : ''
  const cascade = params.cascade ? ' CASCADE' : ''
  return `DROP TABLE${ife} ${tableName}${cascade};`
}

// ---------------------------------------------------------------------------
// 2. Indexes
// ---------------------------------------------------------------------------

export interface CreateIndexParams {
  schema?: string
  table: string
  name: string
  columns: string[]
  unique?: boolean
  concurrently?: boolean
  method?: 'btree' | 'hash' | 'gist' | 'spgist' | 'gin' | 'brin'
  where?: string
  ifNotExists?: boolean
}

export function createIndex(params: CreateIndexParams): string {
  const unique = params.unique ? ' UNIQUE' : ''
  const concurrently = params.concurrently ? ' CONCURRENTLY' : ''
  const ifne = params.ifNotExists ? ' IF NOT EXISTS' : ''
  const method = params.method ? ` USING ${params.method}` : ''
  const tableName = qualifiedName(params.schema, params.table)
  const indexName = quoteIdent(params.name)
  const cols = params.columns.map(quoteIdent).join(', ')
  const where = params.where ? `\nWHERE ${params.where}` : ''
  return `CREATE${unique} INDEX${concurrently}${ifne} ${indexName} ON ${tableName}${method} (${cols})${where};`
}

export interface DropIndexParams {
  schema?: string
  name: string
  ifExists?: boolean
  concurrently?: boolean
  cascade?: boolean
}

export function dropIndex(params: DropIndexParams): string {
  const concurrently = params.concurrently ? ' CONCURRENTLY' : ''
  const ife = params.ifExists ? ' IF EXISTS' : ''
  const cascade = params.cascade ? ' CASCADE' : ''
  const indexName = qualifiedName(params.schema, params.name)
  return `DROP INDEX${concurrently}${ife} ${indexName}${cascade};`
}

// ---------------------------------------------------------------------------
// 3. Functions
// ---------------------------------------------------------------------------

export interface CreateFunctionParams {
  schema?: string
  name: string
  args: string
  returnType: string
  language: string
  body: string
  volatility?: 'VOLATILE' | 'STABLE' | 'IMMUTABLE'
  securityDefiner?: boolean
  replace?: boolean
}

export function createFunction(params: CreateFunctionParams): string {
  const replace = params.replace !== false ? ' OR REPLACE' : ''
  const funcName = qualifiedName(params.schema, params.name)
  const volatility = params.volatility ? `\n${params.volatility}` : ''
  const security = params.securityDefiner ? '\nSECURITY DEFINER' : ''
  return `CREATE${replace} FUNCTION ${funcName}(${params.args})
RETURNS ${params.returnType}
LANGUAGE ${params.language}${volatility}${security}
AS $$
${params.body}
$$;`
}

export interface DropFunctionParams {
  schema?: string
  name: string
  args?: string
  ifExists?: boolean
  cascade?: boolean
}

export function dropFunction(params: DropFunctionParams): string {
  const funcName = qualifiedName(params.schema, params.name)
  const args = params.args !== undefined ? `(${params.args})` : ''
  const ife = params.ifExists ? ' IF EXISTS' : ''
  const cascade = params.cascade ? ' CASCADE' : ''
  return `DROP FUNCTION${ife} ${funcName}${args}${cascade};`
}

// ---------------------------------------------------------------------------
// 4. Triggers
// ---------------------------------------------------------------------------

export interface CreateTriggerParams {
  name: string
  schema?: string
  table: string
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
  events: ('INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE')[]
  forEach?: 'ROW' | 'STATEMENT'
  when?: string
  functionName: string
  functionArgs?: string
}

export function createTrigger(params: CreateTriggerParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const triggerName = quoteIdent(params.name)
  const events = params.events.join(' OR ')
  const forEach = params.forEach ?? 'ROW'
  const when = params.when ? `\nWHEN (${params.when})` : ''
  const funcArgs = params.functionArgs ?? ''
  return `CREATE TRIGGER ${triggerName}
${params.timing} ${events} ON ${tableName}
FOR EACH ${forEach}${when}
EXECUTE FUNCTION ${params.functionName}(${funcArgs});`
}

export interface DropTriggerParams {
  name: string
  schema?: string
  table: string
  ifExists?: boolean
  cascade?: boolean
}

export function dropTrigger(params: DropTriggerParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const triggerName = quoteIdent(params.name)
  const ife = params.ifExists ? ' IF EXISTS' : ''
  const cascade = params.cascade ? ' CASCADE' : ''
  return `DROP TRIGGER${ife} ${triggerName} ON ${tableName}${cascade};`
}

export interface ToggleTriggerParams {
  name: string
  schema?: string
  table: string
  enable: boolean
}

export function alterTriggerEnabled(params: ToggleTriggerParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const triggerName = quoteIdent(params.name)
  const action = params.enable ? 'ENABLE' : 'DISABLE'
  return `ALTER TABLE ${tableName} ${action} TRIGGER ${triggerName};`
}

// ---------------------------------------------------------------------------
// 5. Enum Types
// ---------------------------------------------------------------------------

export interface CreateEnumParams {
  schema?: string
  name: string
  values: string[]
}

export function createEnum(params: CreateEnumParams): string {
  const typeName = qualifiedName(params.schema, params.name)
  const values = params.values.map(quoteLiteral).join(', ')
  return `CREATE TYPE ${typeName} AS ENUM (${values});`
}

export interface AddEnumValueParams {
  schema?: string
  name: string
  value: string
  before?: string
  after?: string
  ifNotExists?: boolean
}

export function alterEnumAddValue(params: AddEnumValueParams): string {
  const typeName = qualifiedName(params.schema, params.name)
  const ifne = params.ifNotExists ? ' IF NOT EXISTS' : ''
  let position = ''
  if (params.before) position = ` BEFORE ${quoteLiteral(params.before)}`
  else if (params.after) position = ` AFTER ${quoteLiteral(params.after)}`
  return `ALTER TYPE ${typeName} ADD VALUE${ifne} ${quoteLiteral(params.value)}${position};`
}

export interface DropTypeParams {
  schema?: string
  name: string
  ifExists?: boolean
  cascade?: boolean
}

export function dropType(params: DropTypeParams): string {
  const typeName = qualifiedName(params.schema, params.name)
  const ife = params.ifExists ? ' IF EXISTS' : ''
  const cascade = params.cascade ? ' CASCADE' : ''
  return `DROP TYPE${ife} ${typeName}${cascade};`
}

// ---------------------------------------------------------------------------
// 6. Extensions
// ---------------------------------------------------------------------------

export interface CreateExtensionParams {
  name: string
  schema?: string
  version?: string
  ifNotExists?: boolean
}

export function createExtension(params: CreateExtensionParams): string {
  const ifne = params.ifNotExists ? ' IF NOT EXISTS' : ''
  const schema = params.schema ? ` SCHEMA ${quoteIdent(params.schema)}` : ''
  const version = params.version ? ` VERSION ${quoteLiteral(params.version)}` : ''
  return `CREATE EXTENSION${ifne} ${quoteIdent(params.name)}${schema}${version};`
}

export interface DropExtensionParams {
  name: string
  ifExists?: boolean
  cascade?: boolean
}

export function dropExtension(params: DropExtensionParams): string {
  const ife = params.ifExists ? ' IF EXISTS' : ''
  const cascade = params.cascade ? ' CASCADE' : ''
  return `DROP EXTENSION${ife} ${quoteIdent(params.name)}${cascade};`
}

// ---------------------------------------------------------------------------
// 7. Publications
// ---------------------------------------------------------------------------

export interface CreatePublicationParams {
  name: string
  forAllTables?: boolean
  tables?: { schema?: string; name: string }[]
  operations?: ('INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE')[]
}

export function createPublication(params: CreatePublicationParams): string {
  const pubName = quoteIdent(params.name)
  let target: string
  if (params.forAllTables) {
    target = ' FOR ALL TABLES'
  } else if (params.tables && params.tables.length > 0) {
    const tableList = params.tables.map((t) => qualifiedName(t.schema, t.name)).join(', ')
    target = ` FOR TABLE ${tableList}`
  } else {
    target = ''
  }
  const ops = params.operations && params.operations.length > 0
    ? ` WITH (publish = '${params.operations.map((o) => o.toLowerCase()).join(', ')}')`
    : ''
  return `CREATE PUBLICATION ${pubName}${target}${ops};`
}

export interface AlterPublicationParams {
  name: string
  addTables?: { schema?: string; name: string }[]
  dropTables?: { schema?: string; name: string }[]
}

export function alterPublication(params: AlterPublicationParams): string {
  const pubName = quoteIdent(params.name)
  const statements: string[] = []
  if (params.addTables && params.addTables.length > 0) {
    const tableList = params.addTables.map((t) => qualifiedName(t.schema, t.name)).join(', ')
    statements.push(`ALTER PUBLICATION ${pubName} ADD TABLE ${tableList};`)
  }
  if (params.dropTables && params.dropTables.length > 0) {
    const tableList = params.dropTables.map((t) => qualifiedName(t.schema, t.name)).join(', ')
    statements.push(`ALTER PUBLICATION ${pubName} DROP TABLE ${tableList};`)
  }
  return statements.join('\n')
}

export interface DropPublicationParams {
  name: string
  ifExists?: boolean
}

export function dropPublication(params: DropPublicationParams): string {
  const ife = params.ifExists ? ' IF EXISTS' : ''
  return `DROP PUBLICATION${ife} ${quoteIdent(params.name)};`
}

// ---------------------------------------------------------------------------
// 8. Roles
// ---------------------------------------------------------------------------

export interface CreateRoleParams {
  name: string
  superuser?: boolean
  createdb?: boolean
  createrole?: boolean
  login?: boolean
  replication?: boolean
  password?: string
  connlimit?: number
  validUntil?: string
  inRole?: string[]
}

export function createRole(params: CreateRoleParams): string {
  const options: string[] = []
  if (params.superuser !== undefined) options.push(params.superuser ? 'SUPERUSER' : 'NOSUPERUSER')
  if (params.createdb !== undefined) options.push(params.createdb ? 'CREATEDB' : 'NOCREATEDB')
  if (params.createrole !== undefined) options.push(params.createrole ? 'CREATEROLE' : 'NOCREATEROLE')
  if (params.login !== undefined) options.push(params.login ? 'LOGIN' : 'NOLOGIN')
  if (params.replication !== undefined) options.push(params.replication ? 'REPLICATION' : 'NOREPLICATION')
  if (params.password !== undefined) options.push(`PASSWORD ${quoteLiteral(params.password)}`)
  if (params.connlimit !== undefined) options.push(`CONNECTION LIMIT ${params.connlimit}`)
  if (params.validUntil !== undefined) options.push(`VALID UNTIL ${quoteLiteral(params.validUntil)}`)
  if (params.inRole && params.inRole.length > 0) options.push(`IN ROLE ${params.inRole.map(quoteIdent).join(', ')}`)
  const opts = options.length > 0 ? ` WITH ${options.join(' ')}` : ''
  return `CREATE ROLE ${quoteIdent(params.name)}${opts};`
}

export interface AlterRoleParams {
  name: string
  superuser?: boolean
  createdb?: boolean
  createrole?: boolean
  login?: boolean
  replication?: boolean
  password?: string
  connlimit?: number
  validUntil?: string
}

export function alterRole(params: AlterRoleParams): string {
  const options: string[] = []
  if (params.superuser !== undefined) options.push(params.superuser ? 'SUPERUSER' : 'NOSUPERUSER')
  if (params.createdb !== undefined) options.push(params.createdb ? 'CREATEDB' : 'NOCREATEDB')
  if (params.createrole !== undefined) options.push(params.createrole ? 'CREATEROLE' : 'NOCREATEROLE')
  if (params.login !== undefined) options.push(params.login ? 'LOGIN' : 'NOLOGIN')
  if (params.replication !== undefined) options.push(params.replication ? 'REPLICATION' : 'NOREPLICATION')
  if (params.password !== undefined) options.push(`PASSWORD ${quoteLiteral(params.password)}`)
  if (params.connlimit !== undefined) options.push(`CONNECTION LIMIT ${params.connlimit}`)
  if (params.validUntil !== undefined) options.push(`VALID UNTIL ${quoteLiteral(params.validUntil)}`)
  const opts = options.length > 0 ? ` WITH ${options.join(' ')}` : ''
  return `ALTER ROLE ${quoteIdent(params.name)}${opts};`
}

export interface DropRoleParams {
  name: string
  ifExists?: boolean
}

export function dropRole(params: DropRoleParams): string {
  const ife = params.ifExists ? ' IF EXISTS' : ''
  return `DROP ROLE${ife} ${quoteIdent(params.name)};`
}

export interface GrantRoleParams {
  role: string
  to: string
}

export function grantRole(params: GrantRoleParams): string {
  return `GRANT ${quoteIdent(params.role)} TO ${quoteIdent(params.to)};`
}

export function revokeRole(params: GrantRoleParams): string {
  return `REVOKE ${quoteIdent(params.role)} FROM ${quoteIdent(params.to)};`
}

// ---------------------------------------------------------------------------
// 9. RLS Policies
// ---------------------------------------------------------------------------

export interface EnableRlsParams {
  schema?: string
  table: string
  force?: boolean
}

export function enableRls(params: EnableRlsParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const force = params.force ? `\nALTER TABLE ${tableName} FORCE ROW LEVEL SECURITY;` : ''
  return `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;${force}`
}

export function disableRls(params: { schema?: string; table: string }): string {
  const tableName = qualifiedName(params.schema, params.table)
  return `ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY;`
}

export interface CreatePolicyParams {
  name: string
  schema?: string
  table: string
  command?: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  permissive?: boolean
  roles?: string[]
  using?: string
  withCheck?: string
}

export function createPolicy(params: CreatePolicyParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const policyName = quoteIdent(params.name)
  const asType = params.permissive === false ? '\nAS RESTRICTIVE' : ''
  const command = params.command ? `\nFOR ${params.command}` : ''
  const roles = params.roles && params.roles.length > 0
    ? `\nTO ${params.roles.join(', ')}`
    : ''
  const using = params.using ? `\nUSING (${params.using})` : ''
  const withCheck = params.withCheck ? `\nWITH CHECK (${params.withCheck})` : ''
  return `CREATE POLICY ${policyName} ON ${tableName}${asType}${command}${roles}${using}${withCheck};`
}

export interface DropPolicyParams {
  name: string
  schema?: string
  table: string
  ifExists?: boolean
}

export function dropPolicy(params: DropPolicyParams): string {
  const tableName = qualifiedName(params.schema, params.table)
  const policyName = quoteIdent(params.name)
  const ife = params.ifExists ? ' IF EXISTS' : ''
  return `DROP POLICY${ife} ${policyName} ON ${tableName};`
}

// ---------------------------------------------------------------------------
// 10. Settings
// ---------------------------------------------------------------------------

export interface AlterSystemSetParams {
  name: string
  value: string
}

export function alterSystemSet(params: AlterSystemSetParams): string {
  return `ALTER SYSTEM SET ${quoteIdent(params.name)} = ${quoteLiteral(params.value)};`
}

export function alterSystemReset(name: string): string {
  return `ALTER SYSTEM RESET ${quoteIdent(name)};`
}

export interface SetSessionParams {
  name: string
  value: string
  local?: boolean
}

export function setSession(params: SetSessionParams): string {
  const scope = params.local ? ' LOCAL' : ''
  return `SET${scope} ${quoteIdent(params.name)} = ${quoteLiteral(params.value)};`
}
