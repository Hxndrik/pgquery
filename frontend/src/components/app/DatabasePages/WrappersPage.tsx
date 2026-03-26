import { useState, useEffect, useCallback } from 'react'
import { queryRecords } from '../../../lib/api'
import { listForeignServers, listForeignTables } from '../../../lib/pgCatalogQueries'
import { WrapperIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps { connectionUrl: string }

interface ForeignServer {
  name: string
  wrapper: string
  options: string[]
}

interface ForeignTable {
  schema: string
  table_name: string
  server: string
  options: string[]
}

export default function WrappersPage({ connectionUrl }: PageProps) {
  const [servers, setServers] = useState<ForeignServer[]>([])
  const [tables, setTables] = useState<ForeignTable[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        queryRecords(connectionUrl, listForeignServers().query, []),
        queryRecords(connectionUrl, listForeignTables().query, []),
      ])
      if (r1.success) setServers(r1.data as unknown as ForeignServer[])
      if (r2.success) setTables(r2.data as unknown as ForeignTable[])
    } catch {
      toast.error('Failed to load foreign data wrappers')
    }
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => { loadData() }, [loadData])

  const formatOptions = (opts: string[] | null) => {
    if (!opts || !Array.isArray(opts)) return '—'
    return opts.join(', ')
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <WrapperIcon size={20} className="text-[var(--fg-subtle)]" />
          <h1 className="text-[17px] font-semibold text-[var(--fg)]">Foreign Data Wrappers</h1>
          <button
            onClick={loadData}
            disabled={loading}
            className="ml-auto text-[13px] px-3 py-1.5 rounded bg-[var(--accent-bg)] text-[var(--accent)] hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[13px] text-[var(--fg-faint)]">Loading…</div>
        ) : (
          <>
            {/* Foreign Servers */}
            <div className="mb-8">
              <h2 className="text-[14px] font-medium text-[var(--fg)] mb-3">Foreign Servers</h2>
              {servers.length === 0 ? (
                <div className="text-[13px] text-[var(--fg-faint)] py-4 border border-[var(--border)] rounded-lg text-center">
                  No foreign servers configured
                </div>
              ) : (
                <div className="overflow-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-raised)]">
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Name</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Wrapper</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servers.map((s) => (
                        <tr key={s.name} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]">
                          <td className="px-3 py-2 font-mono text-[var(--fg)]">{s.name}</td>
                          <td className="px-3 py-2 font-mono text-[var(--fg)]">{s.wrapper}</td>
                          <td className="px-3 py-2 font-mono text-[var(--fg-muted)] text-[11px]">{formatOptions(s.options)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Foreign Tables */}
            <div>
              <h2 className="text-[14px] font-medium text-[var(--fg)] mb-3">Foreign Tables</h2>
              {tables.length === 0 ? (
                <div className="text-[13px] text-[var(--fg-faint)] py-4 border border-[var(--border)] rounded-lg text-center">
                  No foreign tables configured
                </div>
              ) : (
                <div className="overflow-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-raised)]">
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Schema</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Table</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Server</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map((t) => (
                        <tr key={`${t.schema}.${t.table_name}`} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]">
                          <td className="px-3 py-2 font-mono text-[var(--fg-muted)]">{t.schema}</td>
                          <td className="px-3 py-2 font-mono text-[var(--fg)]">{t.table_name}</td>
                          <td className="px-3 py-2 font-mono text-[var(--fg)]">{t.server}</td>
                          <td className="px-3 py-2 font-mono text-[var(--fg-muted)] text-[11px]">{formatOptions(t.options)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
