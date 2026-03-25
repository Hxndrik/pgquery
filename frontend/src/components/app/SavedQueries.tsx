import { useSavedStore } from '../../stores/savedStore'
import { useTabStore } from '../../stores/tabStore'
import { TrashIcon } from '../icons'
import { toast } from 'sonner'

export function SavedQueries() {
  const { queries, delete: deleteQuery } = useSavedStore()
  const { activeTabId, updateSql } = useTabStore()

  if (queries.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-[12px] text-[var(--fg-faint)]">No saved queries</p>
        <p className="text-[11px] text-[var(--fg-faint)] mt-1">Press Ctrl+S to save a query</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {queries.map((q) => (
        <div key={q.id} className="group flex items-start gap-2 px-3 py-2.5 border-b border-[var(--border)] hover:bg-[var(--bg-hover)]">
          <button
            className="flex-1 text-left min-w-0"
            onClick={() => updateSql(activeTabId, q.query)}
          >
            <p className="text-[12px] font-medium text-[var(--fg)] truncate">{q.name}</p>
            <p className="text-[11px] text-[var(--fg-subtle)] font-mono truncate mt-0.5">
              {q.query.trim().slice(0, 60)}
            </p>
          </button>
          <button
            onClick={() => {
              deleteQuery(q.id)
              toast.success('Query deleted')
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--fg-faint)] hover:text-[var(--error)] transition-all rounded shrink-0"
          >
            <TrashIcon size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
