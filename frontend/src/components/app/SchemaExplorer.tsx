import { useState, useEffect } from 'react'
import { ChevronIcon, SearchIcon } from '../icons'
import { Input } from '../ui/Input'
import { fetchSchema, type SchemaResponse } from '../../lib/api'

interface SchemaExplorerProps {
  connectionUrl: string | null
}

function formatRowCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(n)
}

export function SchemaExplorer({ connectionUrl }: SchemaExplorerProps) {
  const [schema, setSchema] = useState<SchemaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!connectionUrl) { setSchema(null); return }
    setLoading(true)
    fetchSchema(connectionUrl).then((s) => {
      setSchema(s)
      setLoading(false)
    })
  }, [connectionUrl])

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (!connectionUrl) {
    return (
      <div className="p-4 text-[12px] text-[var(--fg-faint)] text-center">
        Connect to a database to explore schema
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 text-[12px] text-[var(--fg-subtle)]">Loading schema…</div>
  }

  if (!schema) {
    return <div className="p-4 text-[12px] text-[var(--error)]">Failed to load schema</div>
  }

  const q = search.toLowerCase()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <Input
          placeholder="Search tables…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<SearchIcon size={13} />}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {schema.schemas.map((sc) => (
          <div key={sc.name}>
            {schema.schemas.length > 1 && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[var(--fg-faint)] border-b border-[var(--border)]">
                {sc.name}
              </div>
            )}
            {sc.tables
              .filter((t) => !q || t.name.toLowerCase().includes(q))
              .map((t) => {
                const key = `${sc.name}.${t.name}`
                const isOpen = expanded.has(key)
                return (
                  <div key={t.name}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-hover)] text-left group"
                    >
                      <ChevronIcon
                        size={12}
                        direction={isOpen ? 'down' : 'right'}
                        className="text-[var(--fg-faint)] shrink-0"
                      />
                      <span className="flex-1 text-[12px] text-[var(--fg)] truncate font-mono">{t.name}</span>
                      {t.rowEstimate > 0 && (
                        <span className="text-[10px] text-[var(--fg-faint)] font-mono shrink-0">
                          {formatRowCount(t.rowEstimate)}
                        </span>
                      )}
                    </button>
                    {isOpen && (
                      <div className="pl-7 pr-3 pb-1">
                        {t.columns.map((col) => (
                          <div key={col.name} className="flex items-center gap-2 py-1">
                            {col.isPrimary && (
                              <span className="text-[9px] font-bold text-[var(--warning)] shrink-0">PK</span>
                            )}
                            {!col.isPrimary && (
                              <span className="w-5 shrink-0" />
                            )}
                            <span className="text-[11px] text-[var(--fg-muted)] font-mono truncate flex-1">{col.name}</span>
                            <span className="text-[10px] text-[var(--fg-faint)] font-mono shrink-0">{col.type}</span>
                            {col.nullable && (
                              <span className="text-[9px] text-[var(--fg-faint)] shrink-0">null</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}
