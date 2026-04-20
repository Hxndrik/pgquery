import { useEffect, useState } from 'react'
import { Button } from '../../ui/Button'
import { ChevronIcon } from '../../icons'

interface PaginationProps {
  page: number // 0-indexed
  pageSize: number
  totalCount: number | null
  rowsShown: number
  onPageChange: (next: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500]

export function Pagination({
  page,
  pageSize,
  totalCount,
  rowsShown,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationProps) {
  const totalPages = totalCount !== null ? Math.max(1, Math.ceil(totalCount / pageSize)) : null
  const [input, setInput] = useState(String(page + 1))

  useEffect(() => {
    setInput(String(page + 1))
  }, [page])

  const rangeStart = totalCount === 0 ? 0 : page * pageSize + 1
  const rangeEnd = page * pageSize + rowsShown

  const commitInput = () => {
    const n = parseInt(input, 10)
    if (!Number.isFinite(n) || totalPages === null) {
      setInput(String(page + 1))
      return
    }
    const clamped = Math.min(Math.max(1, n), totalPages) - 1
    if (clamped !== page) onPageChange(clamped)
    else setInput(String(page + 1))
  }

  const atFirst = page === 0
  const atLast = totalPages !== null && page >= totalPages - 1

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[var(--bg-raised)] border-t border-[var(--border)] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[11px] text-[var(--fg-subtle)] tabular-nums whitespace-nowrap">
          {totalCount !== null ? (
            <>
              {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{' '}
              {totalCount.toLocaleString()}
            </>
          ) : (
            <>{rowsShown} rows</>
          )}
        </span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-[11px] text-[var(--fg-subtle)]">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[11px] text-[var(--fg)] px-1.5 py-0.5 focus:outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(0)}
          disabled={atFirst}
          title="First page"
          className="px-1.5"
        >
          <span className="inline-flex">
            <ChevronIcon size={12} direction="left" />
            <ChevronIcon size={12} direction="left" className="-ml-1.5" />
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={atFirst}
          title="Previous page"
          className="px-1.5"
        >
          <ChevronIcon size={12} direction="left" />
        </Button>
        <div className="flex items-center gap-1 px-1 text-[11px] text-[var(--fg-subtle)] tabular-nums">
          <input
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commitInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitInput()
                ;(e.target as HTMLInputElement).blur()
              } else if (e.key === 'Escape') {
                setInput(String(page + 1))
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className="w-10 text-center bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[11px] text-[var(--fg)] px-1 py-0.5 focus:outline-none focus:border-[var(--accent)]"
            aria-label="Page number"
          />
          <span>of {totalPages ?? '?'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={atLast}
          title="Next page"
          className="px-1.5"
        >
          <ChevronIcon size={12} direction="right" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => totalPages !== null && onPageChange(totalPages - 1)}
          disabled={atLast || totalPages === null}
          title="Last page"
          className="px-1.5"
        >
          <span className="inline-flex">
            <ChevronIcon size={12} direction="right" />
            <ChevronIcon size={12} direction="right" className="-ml-1.5" />
          </span>
        </Button>
      </div>
    </div>
  )
}
