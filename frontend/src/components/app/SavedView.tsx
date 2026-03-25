import { ExplorerSection } from './TableExplorer/ExplorerSection'
import { SavedIcon } from '../icons'
import { useSavedStore } from '../../stores/savedStore'

export function SavedView() {
  const { queries } = useSavedStore()

  return (
    <div className="h-full bg-[var(--bg)]">
      <ExplorerSection
        title="Saved Queries"
        icon={<SavedIcon size={14} />}
        items={queries}
        selectedItem={null}
        onSelectItem={() => {}}
        keyExtractor={(item) => item.id}
        renderItem={(item) => (
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-[12px] font-medium text-[var(--fg)]">
              {item.name}
            </span>
            <span className="text-[11px] font-mono truncate text-[var(--fg-faint)]">
              {item.query.split('\n')[0] || 'Empty query'}
            </span>
          </div>
        )}
        searchable={true}
        emptyMessage="No saved queries yet"
        width="w-full"
      />
    </div>
  )
}
