import { Button } from '../../ui/Button'
import { EditIcon, TrashIcon } from '../../icons'

interface BulkActionsBarProps {
  selectedCount: number
  isAllSelected: boolean
  totalCount: number | null
  onEdit: () => void
  onDelete: () => void
  onClear: () => void
}

export function BulkActionsBar({
  selectedCount,
  isAllSelected,
  totalCount,
  onEdit,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  const countText = isAllSelected && totalCount
    ? `All ${totalCount.toLocaleString()} rows selected`
    : `${selectedCount} ${selectedCount === 1 ? 'row' : 'rows'} selected`

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--accent-bg)] border-t border-[var(--accent)] shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium text-[var(--accent)]">{countText}</span>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-[11px] h-6 px-2">
          Clear selection
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onEdit} className="gap-1.5">
          <EditIcon size={12} />
          Edit
        </Button>
        <Button size="sm" onClick={onDelete} className="gap-1.5 bg-[var(--error)] hover:bg-[var(--error)] hover:opacity-90">
          <TrashIcon size={12} />
          Delete
        </Button>
      </div>
    </div>
  )
}
