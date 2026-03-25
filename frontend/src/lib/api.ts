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
