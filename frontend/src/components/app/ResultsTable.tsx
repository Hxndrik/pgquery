import { useState, useMemo, useEffect } from 'react'
import type { ColumnInfo, CutCell } from '../../stores/tabStore'
import { compareValues, isNumericColumn, stringifyValue } from '../../lib/typeUtils'
import { formatBytes } from '../../lib/formatUtils'

interface ResultsTableProps {
  columns: ColumnInfo[]
  rows: unknown[][]
  truncated?: boolean
  cut?: CutCell[]
}

// Long values are shown cut in the grid; exports and the JSON view keep them whole.
const DISPLAY_CHARS = 1000

type SortDir = 'asc' | 'desc' | null

export function CellValue({ value, maxLength, cutSize }: { value: unknown; maxLength?: number; cutSize?: number }) {
  if (value === null || value === undefined) {
    return <span className="italic text-[var(--fg-faint)]">NULL</span>
  }
  const str = stringifyValue(value)
  const shown = maxLength && str.length > maxLength ? str.slice(0, maxLength) : str
  if (shown === str && cutSize === undefined) return <>{str}</>
  return (
    <>
      {shown}
      <span className="text-[var(--fg-faint)]" title={cutSize !== undefined ? `Shortened; the full value is ${formatBytes(cutSize)}` : 'Shortened for display'}>
        …{cutSize !== undefined && ` (${formatBytes(cutSize)})`}
      </span>
    </>
  )
}

function SortIndicator({ dir }: { dir: SortDir }) {
  return (
    <span className="inline-flex flex-col leading-none ml-0.5 -my-0.5" aria-hidden="true">
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        className={dir === 'asc' ? 'text-[var(--accent-text)]' : 'text-[var(--fg-faint)] opacity-50'}
      >
        <path d="M1 4 L4 1 L7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        className={dir === 'desc' ? 'text-[var(--accent-text)]' : 'text-[var(--fg-faint)] opacity-50'}
        style={{ marginTop: '1px' }}
      >
        <path d="M1 1 L4 4 L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  )
}

export function ResultsTable({ columns, rows, truncated, cut }: ResultsTableProps) {
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  // Reset sort when the underlying result changes (e.g. new query run)
  useEffect(() => {
    setSortCol(null)
    setSortDir(null)
  }, [columns, rows])

  const handleSort = (i: number) => {
    // 3-way cycle: off → desc → asc → off
    if (sortCol !== i) {
      setSortCol(i)
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortDir('asc')
    } else {
      setSortCol(null)
      setSortDir(null)
    }
  }

  // Row indexes in display order (cut cells are keyed by the original index).
  const order = useMemo(() => {
    const indexes = rows.map((_, i) => i)
    if (sortCol === null || sortDir === null) return indexes
    const { type = '', category } = columns[sortCol] ?? {}
    return indexes.sort((ai, bi) => {
      const cmp = compareValues(rows[ai][sortCol], rows[bi][sortCol], type, category)
      if (cmp !== 0) return sortDir === 'asc' ? cmp : -cmp
      return ai - bi // stable
    })
  }, [rows, columns, sortCol, sortDir])

  const cutSizes = useMemo(() => new Map((cut ?? []).map((c) => [`${c.row}:${c.col}`, c.size])), [cut])

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
            {columns.map((col, i) => {
              const active = sortCol === i
              const dir = active ? sortDir : null
              const ariaSort = active
                ? sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'
                : 'none'
              return (
                <th
                  key={i}
                  aria-sort={ariaSort}
                  onClick={() => handleSort(i)}
                  title={
                    active
                      ? sortDir === 'desc'
                        ? 'Sorted descending — click for ascending'
                        : 'Sorted ascending — click to clear'
                      : 'Click to sort descending'
                  }
                  className={`
                    group px-3 py-2 text-left border-b border-r border-[var(--border)]
                    text-[10px] font-semibold uppercase tracking-[0.3px]
                    ${active ? 'text-[var(--fg)] bg-[var(--bg-hover)]' : 'text-[var(--fg-subtle)]'}
                    cursor-pointer hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] transition-colors select-none whitespace-nowrap
                    ${isNumericColumn(col) ? 'text-right' : ''}
                  `}
                >
                  <div className={`flex items-center gap-1 ${isNumericColumn(col) ? 'justify-end' : ''}`}>
                    {col.name}
                    <span className="text-[var(--fg-faint)] font-mono normal-case tracking-normal">{col.type}</span>
                    <SortIndicator dir={dir} />
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {order.map((ri) => (
            <tr
              key={ri}
              className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              {rows[ri].map((cell, ci) => (
                <td
                  key={ci}
                  className={`
                    px-3 py-2 border-r border-[var(--border)] text-[var(--fg)] whitespace-nowrap
                    ${columns[ci] && isNumericColumn(columns[ci]) ? 'text-right font-mono' : ''}
                    ${cell === null ? 'text-[var(--fg-faint)]' : ''}
                  `}
                >
                  <CellValue value={cell} maxLength={DISPLAY_CHARS} cutSize={cutSizes.get(`${ri}:${ci}`)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
