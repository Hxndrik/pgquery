import { useState } from 'react'
import { Modal } from '../../../ui/Modal'
import { Button } from '../../../ui/Button'
import { CopyIcon, CheckIcon } from '../../../icons'

interface DDLPreviewModalProps {
  open: boolean
  onClose: () => void
  onExecute: () => void
  title: string
  sql: string
  loading?: boolean
  error?: string | null
}

export function DDLPreviewModal({
  open,
  onClose,
  onExecute,
  title,
  sql,
  loading = false,
  error = null,
}: DDLPreviewModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-2xl">
      <div className="flex flex-col gap-4">
        {/* SQL preview */}
        <div className="relative group rounded border border-[var(--border)] overflow-hidden">
          <button
            onClick={handleCopy}
            className="
              absolute top-2 right-2 z-10 p-1.5 rounded
              text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--bg-hover)]
              opacity-0 group-hover:opacity-100 transition-all
            "
            title="Copy to clipboard"
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          </button>
          <pre className="p-4 bg-[var(--bg)] text-[13px] font-mono text-[var(--fg)] overflow-auto max-h-[400px] leading-relaxed whitespace-pre-wrap">
            {sql}
          </pre>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded border border-[var(--error)]/30 bg-[var(--error)]/5 px-3 py-2">
            <p className="text-[12px] text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={onExecute} disabled={loading}>
            {loading ? 'Executing...' : 'Execute'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
