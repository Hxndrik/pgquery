import { useState } from 'react'
import { ResultsTable } from './ResultsTable'
import { ResultsJSON } from './ResultsJSON'
import { EmptyState } from './EmptyState'
import { Button } from '../ui/Button'
import { DownloadIcon } from '../icons'
import type { QueryResult, QueryError } from '../../stores/tabStore'
import { exportCSV, exportJSON } from '../../lib/exportUtils'

interface ResultsProps {
  result: QueryResult | null
  error: QueryError | null
}

type ResultView = 'table' | 'json'

export function Results({ result, error }: ResultsProps) {
  const [view, setView] = useState<ResultView>('table')

  if (error) {
    return (
      <div className="flex flex-col items-start p-5 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--error)]" />
          <span className="text-[12px] font-semibold text-[var(--error)]">Query Error</span>
          {error.code && (
            <span className="text-[10px] text-[var(--fg-faint)] font-mono border border-[var(--border-mid)] px-1.5 py-0.5 rounded">
              {error.code}
            </span>
          )}
        </div>
        <pre className="text-[12px] font-mono text-[var(--error)] bg-[var(--error-bg)] rounded px-4 py-3 whitespace-pre-wrap max-w-full">
          {error.error}
        </pre>
      </div>
    )
  }

  if (!result) {
    return <EmptyState />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Results header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-raised)] border-b border-[var(--border)] shrink-0">
        {/* View tabs */}
        <div className="flex items-center gap-0.5">
          {(['table', 'json'] as ResultView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                view === v
                  ? 'bg-[var(--bg-active)] text-[var(--fg)]'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-[var(--fg-subtle)]">
          {result.rowCount.toLocaleString()} rows
        </span>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => exportCSV(result.columns, result.rows)}
          className="gap-1 text-[11px]"
        >
          <DownloadIcon size={12} />
          CSV
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => exportJSON(result.columns, result.rows)}
          className="gap-1 text-[11px]"
        >
          <DownloadIcon size={12} />
          JSON
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'table' && (
          <ResultsTable columns={result.columns} rows={result.rows} truncated={result.truncated} />
        )}
        {view === 'json' && (
          <ResultsJSON columns={result.columns} rows={result.rows} />
        )}
      </div>
    </div>
  )
}
