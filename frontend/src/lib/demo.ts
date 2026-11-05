import { useConnectionStore } from '../stores/connectionStore'
import { DEMO_S3_ENDPOINT, isDemoS3Config, isPostgresConfig } from './connectionTypes'
import type { ConnectionConfig, S3Config } from './connectionTypes'
import { testConnection } from './api'
import { testS3Connection } from './s3Api'

/**
 * The hosted demo database. The proxy swaps this exact string for its
 * read-only demo role's URL (see proxy/demo.go), so no credentials reach the browser.
 */
export const DEMO_URL = 'postgres://demo@demo.pgquery/demo'
export const DEMO_NAME = 'Demo · record_store'

/**
 * The hosted demo bucket (see DEMO_S3_ENDPOINT). The keys and bucket below are
 * placeholders the proxy ignores.
 */
export const DEMO_S3_NAME = 'Demo · sample files'
const DEMO_S3_CONFIG: S3Config = { endpoint: DEMO_S3_ENDPOINT, accessKey: 'demo', secretKey: 'demo', bucket: 'demo', region: '' }

export function isDemoUrl(url: string | null | undefined) {
  return url === DEMO_URL
}

/** True for either demo connection. */
export function isDemoConfig(config: ConnectionConfig) {
  return (isPostgresConfig(config) && isDemoUrl(config.url)) || isDemoS3Config(config)
}

/** Add (once) and activate the demo connection. Returns an error message on failure. */
export async function connectDemo(): Promise<string | null> {
  const store = useConnectionStore.getState()
  let conn = store.connections.find((c) => isPostgresConfig(c.config) && c.config.url === DEMO_URL)
  if (!conn) conn = store.addConnection(DEMO_NAME, 'postgres', { url: DEMO_URL })

  store.setStatus('connecting')
  const result = await testConnection(DEMO_URL)
  if (!result.ok) {
    store.setStatus('error')
    return result.error ?? 'The demo database is not reachable right now.'
  }
  store.setActiveConnection(conn.id)
  store.setStatus('connected')
  return null
}

/** Add (once) and activate the demo bucket. Returns an error message on failure. */
export async function connectDemoBucket(): Promise<string | null> {
  const store = useConnectionStore.getState()
  let conn = store.connections.find((c) => isDemoS3Config(c.config))
  if (!conn) conn = store.addConnection(DEMO_S3_NAME, 's3', DEMO_S3_CONFIG)

  store.setStatus('connecting')
  const result = await testS3Connection(DEMO_S3_CONFIG)
  if (!result.ok) {
    store.setStatus('error')
    return result.error ?? 'The demo bucket is not reachable right now.'
  }
  store.setActiveConnection(conn.id)
  store.setStatus('connected')
  return null
}
