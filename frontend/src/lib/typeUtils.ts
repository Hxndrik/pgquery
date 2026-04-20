export const NUMERIC_TYPES = new Set([
  'int2', 'int4', 'int8', 'float4', 'float8', 'numeric',
  'integer', 'bigint', 'smallint', 'real', 'double precision',
])

function baseType(type: string): string {
  return type.toLowerCase().split('(')[0].trim()
}

export function isNumericType(type: string): boolean {
  return NUMERIC_TYPES.has(baseType(type))
}

const JSON_TYPES = new Set(['json', 'jsonb'])

export function isJSONType(type: string): boolean {
  return JSON_TYPES.has(baseType(type))
}

const BOOL_TYPES = new Set(['bool', 'boolean'])

export function isBooleanType(type: string): boolean {
  return BOOL_TYPES.has(baseType(type))
}

const TEMPORAL_TYPES = new Set([
  'date', 'time', 'timetz', 'timestamp', 'timestamptz',
  'timestamp with time zone', 'timestamp without time zone',
  'time with time zone', 'time without time zone',
])

export function isTemporalType(type: string): boolean {
  return TEMPORAL_TYPES.has(baseType(type))
}

export function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function compareValues(a: unknown, b: unknown, type: string): number {
  const aNull = a === null || a === undefined
  const bNull = b === null || b === undefined
  if (aNull && bNull) return 0
  if (aNull) return 1
  if (bNull) return -1

  if (isNumericType(type)) {
    const an = typeof a === 'number' ? a : Number(a)
    const bn = typeof b === 'number' ? b : Number(b)
    const aOk = Number.isFinite(an)
    const bOk = Number.isFinite(bn)
    if (aOk && bOk) return an - bn
    if (aOk) return -1
    if (bOk) return 1
  }

  if (isBooleanType(type)) {
    const av = a === true || a === 't' || a === 'true' ? 1 : 0
    const bv = b === true || b === 't' || b === 'true' ? 1 : 0
    return av - bv
  }

  if (isTemporalType(type)) {
    const at = typeof a === 'string' || a instanceof Date ? new Date(a as string).getTime() : NaN
    const bt = typeof b === 'string' || b instanceof Date ? new Date(b as string).getTime() : NaN
    const aOk = Number.isFinite(at)
    const bOk = Number.isFinite(bt)
    if (aOk && bOk) return at - bt
    if (aOk) return -1
    if (bOk) return 1
  }

  return stringifyValue(a).localeCompare(stringifyValue(b), undefined, { numeric: true, sensitivity: 'base' })
}
