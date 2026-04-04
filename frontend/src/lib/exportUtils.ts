import type { ColumnInfo } from '../stores/tabStore'
import { stringifyValue } from './typeUtils'

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = stringifyValue(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
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
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col.name] = row[i] })
    return obj
  })
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, 'results.json', 'application/json')
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
