import { type ReactNode, useState } from 'react'
import { SearchIcon, PlusIcon, RefreshIcon } from '../../../icons'
import { Button } from '../../../ui/Button'
import { Input } from '../../../ui/Input'
import { SchemaFilter } from './SchemaFilter'

interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  width?: string
}

interface ObjectListPageProps<T> {
  title: string
  icon: ReactNode
  items: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  loading?: boolean
  onRefresh?: () => void
  onCreate?: () => void
  createLabel?: string
  onRowClick?: (item: T) => void
  selectedKey?: string | null
  schemas?: string[]
  selectedSchema?: string | null
  onSchemaChange?: (schema: string | null) => void
  emptyMessage?: string
  searchPlaceholder?: string
}

export function ObjectListPage<T>({
  title,
  icon,
  items,
  columns,
  keyExtractor,
  loading = false,
  onRefresh,
  onCreate,
  createLabel = 'Create',
  onRowClick,
  selectedKey = null,
  schemas,
  selectedSchema,
  onSchemaChange,
  emptyMessage = 'No objects found.',
  searchPlaceholder = 'Filter by name...',
}: ObjectListPageProps<T>) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? items.filter((item) =>
        keyExtractor(item).toLowerCase().includes(search.toLowerCase())
      )
    : items

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--fg-muted)]">{icon}</span>
          <h1 className="text-[14px] font-semibold text-[var(--fg)]">{title}</h1>
          {!loading && (
            <span className="text-[11px] text-[var(--fg-faint)] ml-1">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshIcon size={14} />
            </Button>
          )}
          {onCreate && (
            <Button size="sm" onClick={onCreate}>
              <PlusIcon size={14} />
              {createLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
        {schemas && onSchemaChange && (
          <div className="w-[180px] shrink-0">
            <SchemaFilter
              schemas={schemas}
              selected={selectedSchema ?? null}
              onChange={onSchemaChange}
            />
          </div>
        )}
        <div className="flex-1 max-w-sm">
          <Input
            icon={<SearchIcon size={14} />}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-[13px] text-[var(--fg-faint)]">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-[13px] text-[var(--fg-faint)]">{emptyMessage}</span>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-[var(--bg-raised)] border-b border-[var(--border)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] px-5 py-2.5"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const key = keyExtractor(item)
                const isSelected = key === selectedKey
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={`
                      border-b border-[var(--border)]
                      transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected
                        ? 'bg-[var(--accent-bg)]'
                        : 'hover:bg-[var(--bg-hover)]'
                      }
                    `}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="text-[13px] font-mono text-[var(--fg)] px-5 py-2.5"
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
