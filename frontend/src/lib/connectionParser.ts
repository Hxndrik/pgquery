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
