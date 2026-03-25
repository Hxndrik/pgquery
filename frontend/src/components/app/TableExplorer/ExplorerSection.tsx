import { ReactNode, useState } from 'react'
import { SearchIcon } from '../../icons'
import { Input } from '../../ui/Input'

interface ExplorerSectionProps<T> {
  title: string
  icon: ReactNode
  items: T[]
  selectedItem: string | null
  onSelectItem: (itemName: string) => void
  renderItem: (item: T, isSelected: boolean) => ReactNode
  keyExtractor: (item: T) => string
  searchable?: boolean
  loading?: boolean
  emptyMessage?: string
  width?: string
}

export function ExplorerSection<T>({
  title,
  icon,
  items,
  selectedItem,
  onSelectItem,
  renderItem,
  keyExtractor,
  searchable = false,
  loading = false,
  emptyMessage = 'No items',
  width = 'w-[180px]',
}: ExplorerSectionProps<T>) {
  const [search, setSearch] = useState('')

  const filteredItems = searchable
    ? items.filter((item) => {
        const key = keyExtractor(item)
        return !search || key.toLowerCase().includes(search.toLowerCase())
      })
    : items

  return (
    <div className={`${width} shrink-0 border-r border-[var(--border)] bg-[var(--bg-raised)] overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center gap-2">
        <span className="text-[var(--fg-subtle)] opacity-70 shrink-0">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
          {title}
        </span>
      </div>

      {/* Search */}
      {searchable && (
        <div className="px-2.5 py-2 border-b border-[var(--border)]">
          <Input
            placeholder={`Filter ${title.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon size={13} />}
            className="text-[12px] py-1.5"
          />
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-3 text-[12px] text-[var(--fg-subtle)]">Loading…</div>
        )}
        {!loading && filteredItems.length === 0 && (
          <div className="p-3 text-[12px] text-[var(--fg-faint)]">{emptyMessage}</div>
        )}
        {!loading && filteredItems.map((item) => {
          const key = keyExtractor(item)
          const isSelected = selectedItem === key
          return (
            <button
              key={key}
              onClick={() => onSelectItem(key)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-left transition-colors
                ${isSelected
                  ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]'}
              `}
            >
              {renderItem(item, isSelected)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
