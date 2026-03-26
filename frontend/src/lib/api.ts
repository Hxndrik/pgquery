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
  error?: string
}

export type QueryApiResult =
  | { success: true; data: QueryResult }
  | { success: false; error: QueryError }

export async function executeQuery(
  connection: string,
  query: string,
  params: unknown[] = []
): Promise<QueryApiResult> {
  try {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection, query, params }),
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
    return (await res.json()) as TestResponse
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}
