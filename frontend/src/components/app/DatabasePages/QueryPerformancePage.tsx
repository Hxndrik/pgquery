import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { checkStatStatementsExtension, topQueriesByTime } from '../../../lib/pgCatalogQueries'
import { QueryStatsIcon } from '../../icons'
import { DDLPreviewModal } from './shared'
import { toast } from 'sonner'

interface PageProps { connectionUrl: string }

interface QueryRow {
  query: string
  calls: number
  total_time_ms: number
  mean_time_ms: number
  stddev_time_ms: number
  rows: number
}

export default function QueryPerformancePage({ connectionUrl }: PageProps) {
  const [installed, setInstalled] = useState<boolean | null>(null)
  const [queries, setQueries] = useState<QueryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'total_time_ms' | 'mean_time_ms' | 'calls'>('total_time_ms')
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installing, setInstalling] = useState(false)

  const checkExtension = useCallback(async () => {
    const q = checkStatStatementsExtension()
    const r = await queryRecords(connectionUrl, q.query, q.params ?? [])
    if (r.success && r.data.length > 0) {
      return Boolean(r.data[0].installed)
    }
    return false
  }, [connectionUrl])

  const loadQueries = useCallback(async () => {
    setLoading(true)
    try {
      const ext = await checkExtension()
      setInstalled(ext)

      if (ext) {
        const q = topQueriesByTime(50)
        const r = await queryRecords(connectionUrl, q.query, q.params ?? [])
        if (r.success) {
          setQueries(r.data as unknown as QueryRow[])
        }
      }
    } catch {
      toast.error('Failed to load query performance data')
    }
    setLoading(false)
  }, [connectionUrl, checkExtension])

  useEffect(() => { loadQueries() }, [loadQueries])

  const handleInstall = async () => {
    setInstalling(true)
    const r = await executeQuery(connectionUrl, 'CREATE EXTENSION IF NOT EXISTS pg_stat_statements')
    setInstalling(false)
    if (r.success) {
      toast.success('pg_stat_statements installed')
      setShowInstallModal(false)
      loadQueries()
    } else {
      toast.error(r.error.error)
    }
  }

  const sorted = [...queries].sort((a, b) => Number(b[sortBy]) - Number(a[sortBy]))

  const formatMs = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
    return `${ms.toFixed(2)}ms`
  }

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <QueryStatsIcon size={20} className="text-[var(--fg-subtle)]" />
          <h1 className="text-[17px] font-semibold text-[var(--fg)]">Query Performance</h1>
          {installed && (
            <button
              onClick={loadQueries}
              disabled={loading}
              className="ml-auto text-[13px] px-3 py-1.5 rounded bg-[var(--accent-bg)] text-[var(--accent)] hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[13px] text-[var(--fg-faint)]">Loading…</div>
        ) : installed === false ? (
          <div className="text-center py-12">
            <div className="text-[14px] font-medium text-[var(--fg)] mb-2">
              pg_stat_statements not installed
            </div>
            <p className="text-[13px] text-[var(--fg-muted)] mb-4 max-w-md mx-auto">
              This extension tracks query execution statistics. Install it to see performance data.
            </p>
            <button
              onClick={() => setShowInstallModal(true)}
              className="text-[13px] px-4 py-2 rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              Install pg_stat_statements
            </button>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] uppercase text-[var(--fg-subtle)] font-semibold">Sort by:</span>
              {([
                ['total_time_ms', 'Total Time'],
                ['mean_time_ms', 'Mean Time'],
                ['calls', 'Calls'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`text-[12px] px-2 py-1 rounded transition-colors ${
                    sortBy === key
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium'
                      : 'text-[var(--fg-muted)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-12 text-[13px] text-[var(--fg-faint)]">
                No query statistics available yet. Run some queries first.
              </div>
            ) : (
              <div className="overflow-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-raised)]">
                      <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)] w-[50%]">Query</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--fg-muted)]">Calls</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--fg-muted)]">Total Time</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--fg-muted)]">Mean Time</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--fg-muted)]">Rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((q, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]">
                        <td className="px-3 py-2 font-mono text-[var(--fg)]">
                          <div className="max-w-[600px] truncate" title={q.query}>{q.query}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-right text-[var(--fg)]">{formatNum(Number(q.calls))}</td>
                        <td className="px-3 py-2 font-mono text-right text-[var(--fg)]">{formatMs(Number(q.total_time_ms))}</td>
                        <td className="px-3 py-2 font-mono text-right text-[var(--fg)]">{formatMs(Number(q.mean_time_ms))}</td>
                        <td className="px-3 py-2 font-mono text-right text-[var(--fg)]">{formatNum(Number(q.rows))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <DDLPreviewModal
        open={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onExecute={handleInstall}
        title="Install pg_stat_statements"
        sql="CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
        loading={installing}
      />
    </div>
  )
}
