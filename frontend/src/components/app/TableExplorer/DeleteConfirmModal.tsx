import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
  isAll?: boolean
  totalCount?: number
}

export function DeleteConfirmModal({ open, onClose, onConfirm, count, isAll, totalCount }: DeleteConfirmModalProps) {
  const message = isAll && totalCount
    ? `Delete all ${totalCount.toLocaleString()} rows?`
    : `Delete ${count} ${count === 1 ? 'row' : 'rows'}?`

  return (
    <Modal open={open} onClose={onClose} title="Confirm deletion" width="max-w-md">
      <p className="text-[13px] text-[var(--fg-subtle)] mb-6">
        {message} This action cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={onConfirm} className="bg-[var(--error)] hover:bg-[var(--error)] hover:opacity-90">
          Delete
        </Button>
      </div>
    </Modal>
  )
}
