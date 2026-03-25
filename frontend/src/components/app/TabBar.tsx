import { useTabStore } from '../../stores/tabStore'
import { CloseIcon, PlusIcon } from '../icons'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useTabStore()

  return (
    <div className="flex items-center gap-0 bg-[var(--bg-raised)] border-b border-[var(--border)] overflow-x-auto shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            flex items-center gap-2 px-3 py-2.5 border-r border-[var(--border)] cursor-pointer shrink-0 group
            transition-colors select-none
            ${activeTabId === tab.id
              ? 'bg-[var(--bg)] text-[var(--fg)]'
              : 'text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]'}
          `}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.isLoading && (
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
          )}
          <span className="text-[12px] font-medium max-w-[120px] truncate">{tab.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--fg-faint)] hover:text-[var(--fg)]"
          >
            <CloseIcon size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={addTab}
        className="px-3 py-2.5 text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
        aria-label="New tab"
      >
        <PlusIcon size={14} />
      </button>
    </div>
  )
}
