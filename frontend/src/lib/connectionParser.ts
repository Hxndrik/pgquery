export interface ConnectionFields {
  host: string
  port: string
  database: string
  user: string
  password: string
  ssl: boolean
}

export function parseConnectionUrl(url: string): ConnectionFields {
  const defaults: ConnectionFields = {
    host: 'localhost', port: '5432', database: '', user: '', password: '', ssl: false,
  }
  if (!url) return defaults
  try {
    const normalized = url.replace(/^postgresql:\/\//, 'postgres://')
    const parsed = new URL(normalized)
    const ssl =
      parsed.searchParams.get('sslmode') === 'require' ||
      parsed.searchParams.get('sslmode') === 'verify-full' ||
      parsed.searchParams.get('sslmode') === 'verify-ca'
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port || '5432',
      database: parsed.pathname.replace(/^\//, '') || '',
      user: decodeURIComponent(parsed.username) || '',
      password: decodeURIComponent(parsed.password) || '',
      ssl,
    }
  } catch {
    return defaults
  }
}

const KEY_VALUE_ALIASES: Record<string, 'host' | 'port' | 'database' | 'user' | 'password' | 'sslmode'> = {
  host: 'host', server: 'host',
  port: 'port',
  database: 'database', db: 'database',
  username: 'user', user: 'user', userid: 'user', uid: 'user',
  password: 'password', pwd: 'password',
  sslmode: 'sslmode',
}

/** Detects ADO.NET / Npgsql style strings, e.g. `Host=...;Database=...;Username=...` */
export function isKeyValueConnectionString(input: string): boolean {
  const s = input.trim()
  return !/^postgres(ql)?:\/\//i.test(s) && /^[a-z ]+=/i.test(s) && s.includes(';')
}

/** Splits `k=v;k="v;with;semicolons"` into pairs, honoring quoted values. */
function splitKeyValuePairs(input: string): [string, string][] {
  const pairs: [string, string][] = []
  let i = 0
  while (i < input.length) {
    const eq = input.indexOf('=', i)
    if (eq === -1) break
    const key = input.slice(i, eq).trim()
    let j = eq + 1
    while (input[j] === ' ') j++
    let value = ''
    const quote = input[j]
    if (quote === '"' || quote === "'") {
      j++
      while (j < input.length) {
        if (input[j] === quote && input[j + 1] === quote) { value += quote; j += 2; continue }
        if (input[j] === quote) { j++; break }
        value += input[j++]
      }
      const semi = input.indexOf(';', j)
      i = semi === -1 ? input.length : semi + 1
    } else {
      const semi = input.indexOf(';', j)
      const end = semi === -1 ? input.length : semi
      value = input.slice(j, end).trim()
      i = end + 1
    }
    if (key) pairs.push([key, value])
  }
  return pairs
}

export function parseKeyValueConnectionString(input: string): ConnectionFields {
  const fields: ConnectionFields = {
    host: 'localhost', port: '5432', database: '', user: '', password: '', ssl: false,
  }
  for (const [rawKey, value] of splitKeyValuePairs(input)) {
    const key = KEY_VALUE_ALIASES[rawKey.toLowerCase().replace(/[\s_-]/g, '')]
    if (!key) continue
    if (key === 'sslmode') {
      fields.ssl = ['require', 'verifyca', 'verifyfull'].includes(value.toLowerCase().replace(/[\s_-]/g, ''))
    } else {
      fields[key] = value
    }
  }
  return fields
}

/** Converts key/value connection strings to a postgres:// URL; returns other input unchanged. */
export function normalizeConnectionString(input: string): string {
  return isKeyValueConnectionString(input)
    ? buildConnectionUrl(parseKeyValueConnectionString(input))
    : input
}

export function extractDbName(url: string): string {
  return url.split('@').pop()?.split('/').pop() ?? ''
}

export function buildConnectionUrl(fields: ConnectionFields): string {
  const { host, port, database, user, password, ssl } = fields
  const auth =
    user
      ? `${encodeURIComponent(user)}${password ? ':' + encodeURIComponent(password) : ''}@`
      : ''
  const sslmode = ssl ? '?sslmode=require' : ''
  return `postgres://${auth}${host}:${port}/${database}${sslmode}`
}
