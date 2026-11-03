import { useConnectionHealth } from '../stores/connectionHealthStore'
import type { QueryResult, QueryError } from '../stores/tabStore'

export interface SchemaColumn {
  name: string
  type: string
  nullable: boolean
  isPrimary: boolean
  isUnique: boolean
}

export interface SchemaTable {
  name: string
  rowEstimate: number
  columns: SchemaColumn[]
}

export interface SchemaSchema {
  name: string
  tables: SchemaTable[]
}

export interface SchemaResponse {
  schemas: SchemaSchema[]
}

export interface TestResponse {
  ok: boolean
  version?: string
  database?: string
  /** Whether the proxy's connection to Postgres uses TLS. */
  encrypted?: boolean
  error?: string
}

export type QueryApiResult =
  | { success: true; data: QueryResult }
  | { success: false; error: QueryError }

export interface QueryOptions {
  /**
   * Return every value as Postgres prints it (a string, or null) instead of a
   * JSON value. Exact for every type: int8, numeric, NaN, infinity, intervals,
   * geometry, bytea … Use it wherever user data is shown or written back.
   */
  text?: boolean
  /** Text mode: cut values longer than this many bytes (listed in `cut`). */
  cellLimit?: number
}

export async function executeQuery(
  connection: string,
  query: string,
  params: unknown[] = [],
  options: QueryOptions = {}
): Promise<QueryApiResult> {
  try {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection, query, params, text: options.text || undefined, cellLimit: options.cellLimit || undefined }),
    })
    const data = await res.json() as Record<string, unknown>
    if ('error' in data && data.error) {
      return {
        success: false,
        error: {
          error: String(data.error),
          code: data.code ? String(data.code) : undefined,
          position: data.position ? Number(data.position) : undefined,
        },
      }
    }
    return {
      success: true,
      data: {
        columns: (data.columns as QueryResult['columns']) ?? [],
        rows: (data.rows as QueryResult['rows']) ?? [],
        rowCount: Number(data.rowCount ?? 0),
        duration: Number(data.duration ?? 0),
        truncated: Boolean(data.truncated),
        cut: (data.cut as QueryResult['cut']) ?? undefined,
      },
    }
  } catch (e) {
    return {
      success: false,
      error: { error: e instanceof Error ? e.message : 'Network error' },
    }
  }
}

/** Convert raw rows (unknown[][]) to Record<string, unknown>[] using column names */
export function rowsToRecords(result: QueryResult): Record<string, unknown>[] {
  const colNames = result.columns.map(c => c.name)
  return result.rows.map(row => {
    const record: Record<string, unknown> = {}
    for (let i = 0; i < colNames.length; i++) {
      record[colNames[i]] = row[i]
    }
    return record
  })
}

/** Execute a query and return rows as named records (convenience wrapper) */
export async function queryRecords(
  connection: string,
  query: string,
  params: unknown[] = []
): Promise<{ success: true; data: Record<string, unknown>[]; rowCount: number } | { success: false; error: string }> {
  const result = await executeQuery(connection, query, params)
  if (!result.success) return { success: false, error: result.error.error }
  return { success: true, data: rowsToRecords(result.data), rowCount: result.data.rowCount }
}

export async function fetchSchema(connection: string): Promise<SchemaResponse | null> {
  try {
    const res = await fetch('/api/schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection }),
    })
    if (!res.ok) return null
    return (await res.json()) as SchemaResponse
  } catch {
    return null
  }
}

export async function testConnection(connection: string): Promise<TestResponse> {
  try {
    const res = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection }),
    })
    const result = (await res.json()) as TestResponse
    if (result.ok && typeof result.encrypted === 'boolean') {
      useConnectionHealth.getState().setEncrypted(connection, result.encrypted)
    }
    return result
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}
