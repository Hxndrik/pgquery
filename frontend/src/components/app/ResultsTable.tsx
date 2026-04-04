import { useState, useMemo } from 'react'
import type { ColumnInfo } from '../../stores/tabStore'
import { ChevronIcon } from '../icons'
import { isNumericType, stringifyValue } from '../../lib/typeUtils'

interface ResultsTableProps {
  columns: ColumnInfo[]
  rows: unknown[][]
  truncated?: boolean
}

type SortDir = 'asc' | 'desc' | null

function CellValue({ value, maxLength }: { value: unknown; maxLength?: number }) {
  if (value === null || value === undefined) {
    return <span className="italic text-[var(--fg-faint)]">NULL</span>
  }
  const str = stringifyValue(value)
  if (maxLength && str.length > maxLength) return <>{str.slice(0, maxLength)}<span className="text-[var(--fg-faint)]">…</span></>
  return <>{str}</>
}

export function ResultsTable({ columns, rows, truncated }: ResultsTableProps) {
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const handleSort = (i: number) => {
    if (sortCol !== i) {
      setSortCol(i)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortCol(null)
      setSortDir(null)
    }
  }

  const sorted = useMemo(() => {
    if (sortCol === null || sortDir === null) return rows
    return [...rows].sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      if (av === null) return 1
      if (bv === null) return -1
      const cmp = stringifyValue(av).localeCompare(stringifyValue(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortCol, sortDir])

  return (
    <div className="h-full overflow-auto">
      {truncated && (
        <div className="sticky top-0 z-10 bg-[var(--warning-bg)] border-b border-[var(--border)] px-4 py-1.5 text-[11px] text-[var(--warning)]">
          Results truncated to {rows.length.toLocaleString()} rows
        </div>
      )}
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-[var(--bg-raised)] sticky top-0 z-10">
            {columns.map((col, i) => (
              <th
                key={i}
                onClick={() => handleSort(i)}
                className={`
                  px-3 py-2 text-left border-b border-r border-[var(--border)]
                  text-[10px] font-semibold uppercase tracking-[0.3px] text-[var(--fg-subtle)]
                  cursor-pointer hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] transition-colors select-none whitespace-nowrap
                  ${isNumericType(col.type) ? 'text-right' : ''}
                `}
              >
                <div className={`flex items-center gap-1 ${isNumericType(col.type) ? 'justify-end' : ''}`}>
                  {col.name}
                  <span className="text-[var(--fg-faint)] font-mono normal-case tracking-normal">{col.type}</span>
                  {sortCol === i && sortDir && (
                    <ChevronIcon size={10} direction={sortDir === 'asc' ? 'up' : 'down'} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`
                    px-3 py-2 border-r border-[var(--border)] text-[var(--fg)] whitespace-nowrap
                    ${isNumericType(columns[ci]?.type ?? '') ? 'text-right font-mono' : ''}
                    ${cell === null ? 'text-[var(--fg-faint)]' : ''}
                  `}
                >
                  <CellValue value={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
