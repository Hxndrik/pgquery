export const NUMERIC_TYPES = new Set([
  'int2', 'int4', 'int8', 'float4', 'float8', 'numeric',
  'integer', 'bigint', 'smallint', 'real', 'double precision',
])

export function isNumericType(type: string): boolean {
  return NUMERIC_TYPES.has(type.toLowerCase().split('(')[0].trim())
}

const JSON_TYPES = new Set(['json', 'jsonb'])

export function isJSONType(type: string): boolean {
  return JSON_TYPES.has(type.toLowerCase().split('(')[0].trim())
}

export function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
