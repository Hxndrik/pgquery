import { ExplorerSection } from './TableExplorer/ExplorerSection'
import { HistoryIcon } from '../icons'
import { useHistoryStore } from '../../stores/historyStore'

export function HistoryView() {
  const { entries } = useHistoryStore()

  return (
    <div className="h-full bg-[var(--bg)]">
      <ExplorerSection
        title="Query History"
        icon={<HistoryIcon size={14} />}
        items={entries}
        selectedItem={null}
        onSelectItem={() => {}}
        keyExtractor={(item) => item.id}
        renderItem={(item) => (
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-[12px] font-mono truncate text-[var(--fg)]">
              {item.query.split('\n')[0] || 'Empty query'}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-[var(--fg-faint)]">
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              <span>•</span>
              <span>{item.duration}ms</span>
              {item.rowCount !== undefined && (
                <>
                  <span>•</span>
                  <span>{item.rowCount} rows</span>
                </>
              )}
            </div>
          </div>
        )}
        searchable={true}
        emptyMessage="No query history yet"
        width="w-full"
      />
    </div>
  )
}
