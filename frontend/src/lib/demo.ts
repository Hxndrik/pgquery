import { useConnectionStore } from '../stores/connectionStore'
import { isPostgresConfig } from './connectionTypes'
import { testConnection } from './api'

/**
 * The hosted demo database. The proxy swaps this exact string for its
 * read-only demo role's URL (see proxy/demo.go), so no credentials reach the browser.
 */
export const DEMO_URL = 'postgres://demo@demo.pgquery/demo'
export const DEMO_NAME = 'Demo · record_store'

export function isDemoUrl(url: string | null | undefined) {
  return url === DEMO_URL
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
