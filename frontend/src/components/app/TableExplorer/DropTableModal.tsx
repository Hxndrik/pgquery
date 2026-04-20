import { useState } from 'react'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'

interface DropTableModalProps {
  open: boolean
  schemaName: string
  tableName: string
  onClose: () => void
  onConfirm: (cascade: boolean) => void
  loading?: boolean
}

function DropTableForm({
  schemaName,
  tableName,
  onClose,
  onConfirm,
  loading,
}: Omit<DropTableModalProps, 'open'>) {
  const [confirmText, setConfirmText] = useState('')
  const [cascade, setCascade] = useState(false)
  const canConfirm = confirmText === tableName && !loading

  return (
    <div className="flex flex-col gap-4">
      <div className="text-[13px] text-[var(--fg-subtle)] leading-relaxed">
        This will permanently drop{' '}
        <span className="font-mono text-[var(--fg)]">
          {schemaName}.{tableName}
        </span>{' '}
        and all its data. This action cannot be undone.
      </div>

      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={cascade}
          onChange={(e) => setCascade(e.target.checked)}
          className="accent-[var(--accent)] mt-0.5"
        />
        <span className="text-[12px] text-[var(--fg-muted)] leading-snug">
          <span className="font-mono text-[var(--fg)]">CASCADE</span> — also
          drop dependent objects (views, foreign keys, etc.)
        </span>
      </label>

      <Input
        label={`Type "${tableName}" to confirm`}
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        autoFocus
        placeholder={tableName}
      />

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canConfirm}
          onClick={() => onConfirm(cascade)}
          className="bg-[var(--error)] hover:bg-[var(--error)] hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Dropping…' : 'Drop table'}
        </Button>
      </div>
    </div>
  )
}

export function DropTableModal(props: DropTableModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Drop table" width="max-w-md">
      {/* Inner component mounts when modal opens; state resets automatically. */}
      <DropTableForm
        schemaName={props.schemaName}
        tableName={props.tableName}
        onClose={props.onClose}
        onConfirm={props.onConfirm}
        loading={props.loading}
      />
    </Modal>
  )
}
