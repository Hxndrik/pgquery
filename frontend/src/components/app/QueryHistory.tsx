import { useHistoryStore } from '../../stores/historyStore'
import { useTabStore } from '../../stores/tabStore'
import { formatTime } from '../../lib/formatUtils'

export function QueryHistory() {
  const { entries, clear } = useHistoryStore()
  const { activeTabId, updateSql } = useTabStore()

  if (entries.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-[12px] text-[var(--fg-faint)]">No query history yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-[11px] text-[var(--fg-muted)]">{entries.length} queries</span>
        <button
          onClick={clear}
          className="text-[11px] text-[var(--fg-subtle)] hover:text-[var(--error)] transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => updateSql(activeTabId, entry.query)}
            className="w-full text-left px-3 py-2.5 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] group"
          >
            <div className="text-[11px] text-[var(--fg)] font-mono truncate leading-relaxed">
              {entry.query.trim().slice(0, 80)}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-[var(--fg-faint)]">{formatTime(entry.timestamp)}</span>
              <span className="text-[10px] text-[var(--fg-faint)]">{entry.duration}ms</span>
              <span className="text-[10px] text-[var(--fg-faint)]">{entry.rowCount} rows</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
