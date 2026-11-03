import type { SchemaSchema } from './api'

// Remembers the last schema/table opened in the Tables view, per connection,
// so reopening it lands where you left off instead of on the first schema
// alphabetically (often a system or extension schema).

const KEY = 'pgquery-explorer-selection'

export interface ExplorerSelection {
  schema: string
  table: string | null
}

/** Short, stable key for a connection without storing the URL twice. */
function connKey(connectionUrl: string): string {
  let h = 5381
  for (let i = 0; i < connectionUrl.length; i++) h = ((h << 5) + h + connectionUrl.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

function readAll(): Record<string, ExplorerSelection> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveExplorerSelection(connectionUrl: string, selection: ExplorerSelection) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [connKey(connectionUrl)]: selection }))
  } catch {
    // Storage full or blocked: remembering is a convenience only.
  }
}

/**
 * The selection to open: the remembered one if it still exists, otherwise
 * `public` (or the first schema that has tables) and its first table.
 */
export function initialExplorerSelection(connectionUrl: string, schemas: SchemaSchema[]): ExplorerSelection | null {
  const saved = readAll()[connKey(connectionUrl)]
  const savedSchema = saved && schemas.find((s) => s.name === saved.schema)
  if (savedSchema) {
    const table = savedSchema.tables.some((t) => t.name === saved.table) ? saved.table : (savedSchema.tables[0]?.name ?? null)
    return { schema: savedSchema.name, table }
  }
  const fallback =
    schemas.find((s) => s.name === 'public' && s.tables.length > 0) ??
    schemas.find((s) => s.tables.length > 0) ??
    schemas[0]
  return fallback ? { schema: fallback.name, table: fallback.tables[0]?.name ?? null } : null
}
