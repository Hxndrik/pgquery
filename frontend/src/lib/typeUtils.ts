export const NUMERIC_TYPES = new Set([
  'int2', 'int4', 'int8', 'float4', 'float8', 'numeric',
  'integer', 'bigint', 'smallint', 'real', 'double precision',
])

export function isNumericType(type: string): boolean {
  return NUMERIC_TYPES.has(type.toLowerCase().split('(')[0].trim())
}
