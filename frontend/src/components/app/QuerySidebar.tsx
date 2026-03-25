import { useState } from 'react'
import { ChevronIcon, HistoryIcon, SavedIcon, TrashIcon } from '../icons'
import { useHistoryStore } from '../../stores/historyStore'
import { useSavedStore } from '../../stores/savedStore'
import { useTabStore } from '../../stores/tabStore'
import { toast } from 'sonner'

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function QuerySidebar() {
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [savedExpanded, setSavedExpanded] = useState(true)
  
  const { entries: historyEntries, clear: clearHistory } = useHistoryStore()
  const { queries: savedQueries, delete: deleteSaved } = useSavedStore()
  const { activeTabId, updateSql } = useTabStore()

  return (
    <div className="w-[280px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-raised)] h-full flex flex-col overflow-hidden">
      {/* Saved Queries Section */}
      <div className="border-b border-[var(--border)]">
        <button
          onClick={() => setSavedExpanded(!savedExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
        >
          <ChevronIcon 
            size={14} 
            direction={savedExpanded ? 'down' : 'right'} 
            className="text-[var(--fg-subtle)] shrink-0"
          />
          <SavedIcon size={14} className="text-[var(--fg-subtle)] shrink-0" />
          <span className="text-[12px] font-semibold text-[var(--fg)] flex-1">Saved Queries</span>
          <span className="text-[10px] text-[var(--fg-faint)]">{savedQueries.length}</span>
        </button>
        
        {savedExpanded && (
          <div className="max-h-[300px] overflow-y-auto">
            {savedQueries.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[11px] text-[var(--fg-faint)]">No saved queries</p>
                <p className="text-[10px] text-[var(--fg-faint)] mt-1">Press Ctrl+S to save</p>
              </div>
            ) : (
              savedQueries.map((q) => (
                <div
                  key={q.id}
                  className="group flex items-start gap-2 px-3 py-2 hover:bg-[var(--bg-hover)] border-b border-[var(--border)]"
                >
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => updateSql(activeTabId, q.query)}
                  >
                    <p className="text-[11px] font-medium text-[var(--fg)] truncate">{q.name}</p>
                    <p className="text-[10px] text-[var(--fg-subtle)] font-mono truncate mt-0.5">
                      {q.query.trim().split('\n')[0].slice(0, 40)}
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      deleteSaved(q.id)
                      toast.success('Query deleted')
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--fg-faint)] hover:text-[var(--error)] transition-all rounded shrink-0"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="border-b border-[var(--border)] flex-1 flex flex-col overflow-hidden">
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors shrink-0"
        >
          <ChevronIcon 
            size={14} 
            direction={historyExpanded ? 'down' : 'right'} 
            className="text-[var(--fg-subtle)] shrink-0"
          />
          <HistoryIcon size={14} className="text-[var(--fg-subtle)] shrink-0" />
          <span className="text-[12px] font-semibold text-[var(--fg)] flex-1">History</span>
          <span className="text-[10px] text-[var(--fg-faint)]">{historyEntries.length}</span>
          {historyEntries.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearHistory()
                toast.success('History cleared')
              }}
              className="text-[10px] text-[var(--fg-subtle)] hover:text-[var(--error)] transition-colors"
            >
              Clear
            </button>
          )}
        </button>
        
        {historyExpanded && (
          <div className="flex-1 overflow-y-auto">
            {historyEntries.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[11px] text-[var(--fg-faint)]">No query history</p>
              </div>
            ) : (
              historyEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => updateSql(activeTabId, entry.query)}
                  className="w-full text-left px-3 py-2 border-b border-[var(--border)] hover:bg-[var(--bg-hover)]"
                >
                  <div className="text-[10px] text-[var(--fg)] font-mono truncate leading-relaxed">
                    {entry.query.trim().split('\n')[0].slice(0, 50)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-[var(--fg-faint)]">{formatTime(entry.timestamp)}</span>
                    <span className="text-[9px] text-[var(--fg-faint)]">{entry.duration}ms</span>
                    <span className="text-[9px] text-[var(--fg-faint)]">{entry.rowCount} rows</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
