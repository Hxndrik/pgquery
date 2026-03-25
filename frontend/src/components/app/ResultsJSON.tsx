import type { ColumnInfo } from '../../stores/tabStore'

interface ResultsJSONProps {
  columns: ColumnInfo[]
  rows: unknown[][]
}

function colorizeJSON(json: string): string {
  return json
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:var(--accent)">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:var(--success)">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:var(--warning)">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span style="color:var(--accent)">$1</span>')
    .replace(/:\s*(null)/g, ': <span style="color:var(--fg-faint)">$1</span>')
}

export function ResultsJSON({ columns, rows }: ResultsJSONProps) {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col.name] = row[i] })
    return obj
  })
  const json = JSON.stringify(data, null, 2)
  const colorized = colorizeJSON(json)

  return (
    <div className="h-full overflow-auto p-4">
      <pre
        className="text-[12px] font-mono text-[var(--fg)] leading-relaxed whitespace-pre"
        dangerouslySetInnerHTML={{ __html: colorized }}
      />
    </div>
  )
}
