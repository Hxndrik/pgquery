export const NUMERIC_TYPES = new Set([
  'int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'decimal', 'money',
  'integer', 'bigint', 'smallint', 'real', 'double precision',
])

const FLOAT_TYPES = new Set(['float4', 'float8', 'real', 'double precision'])

function baseType(type: string): string {
  return type.toLowerCase().split('(')[0].trim()
}

export function isNumericType(type: string): boolean {
  return NUMERIC_TYPES.has(baseType(type))
}

/**
 * Right-align and sort numerically? Text-mode results carry the type category
 * (N = numeric); reg* types (regclass …) are in N too but print names.
 */
export function isNumericColumn(col: { type: string; category?: string }): boolean {
  if (col.category) return col.category === 'N' && !baseType(col.type).startsWith('reg')
  return isNumericType(col.type)
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

/** Postgres prints booleans as t / f in text mode. */
export function isTrue(value: unknown): boolean {
  return value === true || value === 't' || value === 'true'
}

// ── exact numeric comparison ─────────────────────────────────

const DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?$/

/**
 * Compare two numbers given as decimal text (int8 and numeric print without
 * exponents), exactly: Number() would round past 2^53 or 17 digits. Postgres
 * sorts NaN above everything, Infinity just below it. Returns null when either
 * side isn't decimal text.
 */
export function compareDecimalText(a: string, b: string): number | null {
  const rank = (s: string) => (s === 'NaN' ? 3 : s === 'Infinity' ? 2 : s === '-Infinity' ? -2 : 0)
  const ra = rank(a)
  const rb = rank(b)
  if (ra !== 0 || rb !== 0) return ra === rb ? 0 : ra - rb
  const ma = DECIMAL.exec(a)
  const mb = DECIMAL.exec(b)
  if (!ma || !mb) return null
  const norm = (m: RegExpExecArray) => {
    const int = m[2].replace(/^0+/, '')
    const frac = (m[3] ?? '').replace(/0+$/, '')
    const zero = int === '' && frac === ''
    return { neg: m[1] === '-' && !zero, int, frac }
  }
  const x = norm(ma)
  const y = norm(mb)
  if (x.neg !== y.neg) return x.neg ? -1 : 1
  let cmp = x.int.length - y.int.length
  if (cmp === 0) cmp = x.int < y.int ? -1 : x.int > y.int ? 1 : 0
  if (cmp === 0) {
    const len = Math.max(x.frac.length, y.frac.length)
    const fx = x.frac.padEnd(len, '0')
    const fy = y.frac.padEnd(len, '0')
    cmp = fx < fy ? -1 : fx > fy ? 1 : 0
  }
  return x.neg ? -cmp : cmp
}

/** "-$1,234.56" or "($1,234.56)" → "-1234.56" */
function moneyToDecimal(s: string): string {
  const neg = s.includes('-') || s.startsWith('(')
  const digits = s.replace(/[^\d.]/g, '')
  return (neg ? '-' : '') + digits
}

function numericSortValue(v: unknown, type: string): number | string | null {
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return null
  const t = baseType(type)
  if (FLOAT_TYPES.has(t)) {
    // Floats print as shortest exact text (with an exponent when large), so
    // Number() is exact. NaN sorts last, like in Postgres.
    if (v === 'NaN') return Number.POSITIVE_INFINITY
    return Number(v)
  }
  return t === 'money' ? moneyToDecimal(v) : v
}

function compareNumeric(a: unknown, b: unknown, type: string): number | null {
  const x = numericSortValue(a, type)
  const y = numericSortValue(b, type)
  if (x === null || y === null) return null
  if (typeof x === 'string' && typeof y === 'string') return compareDecimalText(x, y)
  const nx = typeof x === 'number' ? x : Number(x)
  const ny = typeof y === 'number' ? y : Number(y)
  if (Number.isNaN(nx) || Number.isNaN(ny)) return null
  // Treat NaN text in float columns (mapped to +Infinity above) as equal to itself.
  return nx === ny ? 0 : nx < ny ? -1 : 1
}

function temporalSortValue(v: unknown): number {
  if (v instanceof Date) return v.getTime()
  if (typeof v !== 'string') return NaN
  if (v === 'infinity') return Number.POSITIVE_INFINITY
  if (v === '-infinity') return Number.NEGATIVE_INFINITY
  if (v.endsWith(' BC')) return NaN // before year 1: compare as text instead
  // "2024-02-29 13:45:30.123456+01" → ISO, which every browser parses
  const iso = v.replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00')
  return Date.parse(iso)
}

export function compareValues(a: unknown, b: unknown, type: string, category?: string): number {
  const aNull = a === null || a === undefined
  const bNull = b === null || b === undefined
  if (aNull && bNull) return 0
  if (aNull) return 1
  if (bNull) return -1

  if (isNumericColumn({ type, category })) {
    const cmp = compareNumeric(a, b, type)
    if (cmp !== null) return cmp
  }

  if (isBooleanType(type)) {
    return (isTrue(a) ? 1 : 0) - (isTrue(b) ? 1 : 0)
  }

  // Dates and timestamps by instant; time of day sorts fine as text (fixed-width HH:MM:SS).
  const t = baseType(type)
  if (t === 'date' || t.startsWith('timestamp')) {
    const at = temporalSortValue(a)
    const bt = temporalSortValue(b)
    const aOk = !Number.isNaN(at)
    const bOk = !Number.isNaN(bt)
    if (aOk && bOk) return at === bt ? 0 : at < bt ? -1 : 1
  }

  return stringifyValue(a).localeCompare(stringifyValue(b), undefined, { numeric: true, sensitivity: 'base' })
}
