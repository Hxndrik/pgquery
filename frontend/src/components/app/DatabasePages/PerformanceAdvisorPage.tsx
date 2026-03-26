import { useState, useEffect, useCallback } from 'react'
import { queryRecords } from '../../../lib/api'
import { unusedIndexes, tableBloat, cacheHitRatio, seqScanStats } from '../../../lib/pgCatalogQueries'
import { PerformanceIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps { connectionUrl: string }

interface Section {
  title: string
  description: string
  status: 'good' | 'warn' | 'bad'
  metric?: string
  rows: Record<string, unknown>[]
  columns: { key: string; header: string }[]
}

export default function PerformanceAdvisorPage({ connectionUrl }: PageProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    const results: Section[] = []

    try {
      // Cache hit ratio
      const q1 = cacheHitRatio()
      const r1 = await queryRecords(connectionUrl, q1.query, q1.params ?? [])
      if (r1.success && r1.data.length > 0) {
        const ratio = Number(r1.data[0].hit_ratio_pct ?? 0)
        results.push({
          title: 'Cache Hit Ratio',
          description: 'Percentage of data reads served from shared buffers. Should be above 95%.',
          status: ratio >= 95 ? 'good' : ratio >= 80 ? 'warn' : 'bad',
          metric: `${ratio}%`,
          rows: [],
          columns: [],
        })
      }

      // Unused indexes
      const q2 = unusedIndexes()
      const r2 = await queryRecords(connectionUrl, q2.query, q2.params ?? [])
      if (r2.success) {
        results.push({
          title: 'Unused Indexes',
          description: 'Indexes that have never been used for scans. They waste disk space and slow down writes.',
          status: r2.data.length === 0 ? 'good' : r2.data.length <= 3 ? 'warn' : 'bad',
          metric: `${r2.data.length} found`,
          rows: r2.data,
          columns: [
            { key: 'schema', header: 'Schema' },
            { key: 'table_name', header: 'Table' },
            { key: 'index_name', header: 'Index' },
            { key: 'size', header: 'Size' },
          ],
        })
      }

      // Table bloat
      const q3 = tableBloat()
      const r3 = await queryRecords(connectionUrl, q3.query, q3.params ?? [])
      if (r3.success) {
        const bloated = r3.data.filter((r) => Number(r.dead_ratio_pct) > 10)
        results.push({
          title: 'Table Bloat',
          description: 'Tables with significant dead tuple ratio. Consider running VACUUM or VACUUM FULL.',
          status: bloated.length === 0 ? 'good' : bloated.length <= 3 ? 'warn' : 'bad',
          metric: `${bloated.length} tables with >10% dead tuples`,
          rows: r3.data,
          columns: [
            { key: 'schema', header: 'Schema' },
            { key: 'table_name', header: 'Table' },
            { key: 'live_tuples', header: 'Live Rows' },
            { key: 'dead_tuples', header: 'Dead Rows' },
            { key: 'dead_ratio_pct', header: 'Dead %' },
            { key: 'last_autovacuum', header: 'Last Vacuum' },
          ],
        })
      }

      // Sequential scans on large tables
      const q4 = seqScanStats()
      const r4 = await queryRecords(connectionUrl, q4.query, q4.params ?? [])
      if (r4.success) {
        const highSeq = r4.data.filter((r) => Number(r.seq_scan_pct) > 80 && Number(r.seq_tup_read) > 10000)
        results.push({
          title: 'Sequential Scan Heavy Tables',
          description: 'Tables where >80% of reads are sequential scans. Consider adding indexes.',
          status: highSeq.length === 0 ? 'good' : highSeq.length <= 3 ? 'warn' : 'bad',
          metric: `${highSeq.length} tables`,
          rows: highSeq,
          columns: [
            { key: 'schema', header: 'Schema' },
            { key: 'table_name', header: 'Table' },
            { key: 'seq_scan', header: 'Seq Scans' },
            { key: 'idx_scan', header: 'Idx Scans' },
            { key: 'seq_scan_pct', header: 'Seq %' },
          ],
        })
      }

      // Connection count
      const r5 = await queryRecords(connectionUrl, "SELECT count(*) as current, (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_conn FROM pg_stat_activity", [])
      if (r5.success && r5.data.length > 0) {
        const current = Number(r5.data[0].current)
        const max = Number(r5.data[0].max_conn)
        const pct = max > 0 ? Math.round((current / max) * 100) : 0
        results.push({
          title: 'Connection Utilization',
          description: 'Current connections vs max_connections setting.',
          status: pct < 60 ? 'good' : pct < 85 ? 'warn' : 'bad',
          metric: `${current} / ${max} (${pct}%)`,
          rows: [],
          columns: [],
        })
      }
    } catch {
      toast.error('Failed to run performance analysis')
    }

    setSections(results)
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => { runAnalysis() }, [runAnalysis])

  const statusColor = (s: Section['status']) => {
    switch (s) {
      case 'good': return 'text-green-500'
      case 'warn': return 'text-yellow-500'
      case 'bad': return 'text-red-500'
    }
  }

  const statusBg = (s: Section['status']) => {
    switch (s) {
      case 'good': return 'bg-green-500/10 border-green-500/20'
      case 'warn': return 'bg-yellow-500/10 border-yellow-500/20'
      case 'bad': return 'bg-red-500/10 border-red-500/20'
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <PerformanceIcon size={20} className="text-[var(--fg-subtle)]" />
          <h1 className="text-[17px] font-semibold text-[var(--fg)]">Performance Advisor</h1>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="ml-auto text-[13px] px-3 py-1.5 rounded bg-[var(--accent-bg)] text-[var(--accent)] hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Analyzing…' : 'Re-analyze'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[13px] text-[var(--fg-faint)]">Running performance analysis…</div>
        ) : (
          <div className="flex flex-col gap-4">
            {sections.map((section, i) => (
              <div key={i} className={`rounded-lg border p-4 ${statusBg(section.status)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[var(--fg)]">{section.title}</span>
                  {section.metric && (
                    <span className={`text-[13px] font-mono font-medium ${statusColor(section.status)}`}>
                      {section.metric}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--fg-muted)] mb-2">{section.description}</p>

                {section.rows.length > 0 && (
                  <div className="mt-3 overflow-auto rounded border border-[var(--border)]">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                          {section.columns.map(col => (
                            <th key={col.key} className="text-left px-3 py-1.5 font-medium text-[var(--fg-muted)]">
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.slice(0, 20).map((row, j) => (
                          <tr key={j} className="border-b border-[var(--border)] last:border-0">
                            {section.columns.map(col => (
                              <td key={col.key} className="px-3 py-1.5 font-mono text-[var(--fg)]">
                                {row[col.key] != null ? String(row[col.key]) : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {section.rows.length > 20 && (
                      <div className="px-3 py-1.5 text-[11px] text-[var(--fg-faint)] bg-[var(--bg)]">
                        Showing 20 of {section.rows.length} rows
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
