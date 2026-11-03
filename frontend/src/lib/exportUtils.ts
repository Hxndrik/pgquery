import type { ColumnInfo } from '../stores/tabStore'
import { isJSONType, isNumericColumn, isBooleanType, stringifyValue } from './typeUtils'

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = stringifyValue(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportCSV(columns: ColumnInfo[], rows: unknown[][]): void {
  const header = columns.map((c) => escapeCSV(c.name)).join(',')
  const body = rows.map((row) => row.map(escapeCSV).join(',')).join('\n')
  const csv = header + '\n' + body
  downloadFile(csv, 'results.csv', 'text/csv')
}

export function exportJSON(columns: ColumnInfo[], rows: unknown[][]): void {
  downloadFile(resultToJSON(columns, rows), 'results.json', 'application/json')
}

// ── exact JSON ───────────────────────────────────────────────

const JSON_NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/

/**
 * One cell as JSON text. Text-mode values are written without going through
 * JS numbers: numeric text stays a bare number with all its digits, json and
 * jsonb are inserted verbatim (duplicate keys and key order included), and
 * anything JSON can't represent (NaN, Infinity, money, intervals …) is a string.
 */
function cellJSON(value: unknown, col: ColumnInfo): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value !== 'string') return JSON.stringify(value) ?? 'null' // typed results
  if (isJSONType(col.type)) return value
  if (isBooleanType(col.type) && (value === 't' || value === 'f')) return value === 't' ? 'true' : 'false'
  if (isNumericColumn(col) && !col.type.startsWith('money') && JSON_NUMBER.test(value)) return value
  return JSON.stringify(value)
}

/** Object keys for the columns; a repeated name gets a suffix: id, id_2, id_3. */
function uniqueKeys(columns: ColumnInfo[]): string[] {
  const seen = new Map<string, number>()
  return columns.map((c) => {
    const n = (seen.get(c.name) ?? 0) + 1
    seen.set(c.name, n)
    return n === 1 ? c.name : `${c.name}_${n}`
  })
}

/** The result as a pretty-printed JSON array of row objects, exact to the digit. */
export function resultToJSON(columns: ColumnInfo[], rows: unknown[][]): string {
  const keys = uniqueKeys(columns).map((k) => JSON.stringify(k))
  const compact =
    '[' +
    rows.map((row) => '{' + columns.map((c, i) => `${keys[i]}:${cellJSON(row[i], c)}`).join(',') + '}').join(',') +
    ']'
  return prettyJSON(compact)
}

/**
 * Re-indent JSON text without parsing it, so numbers keep every digit and
 * objects keep duplicate keys. The input must be valid JSON.
 */
export function prettyJSON(json: string, indent = '  '): string {
  let out = ''
  let depth = 0
  let inString = false
  for (let i = 0; i < json.length; i++) {
    const ch = json[i]
    if (inString) {
      out += ch
      if (ch === '\\') out += json[++i]
      else if (ch === '"') inString = false
      continue
    }
    switch (ch) {
      case '"':
        inString = true
        out += ch
        break
      case '{':
      case '[': {
        // Keep empty containers on one line.
        let j = i + 1
        while (/\s/.test(json[j] ?? '')) j++
        if (json[j] === (ch === '{' ? '}' : ']')) {
          out += ch + json[j]
          i = j
        } else {
          depth++
          out += ch + '\n' + indent.repeat(depth)
        }
        break
      }
      case '}':
      case ']':
        depth--
        out += '\n' + indent.repeat(depth) + ch
        break
      case ',':
        out += ',\n' + indent.repeat(depth)
        break
      case ':':
        out += ': '
        break
      case ' ':
      case '\n':
      case '\r':
      case '\t':
        break
      default:
        out += ch
    }
  }
  return out
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
