import { useState, useEffect, useRef } from 'react'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import type { SchemaColumn } from '../../../lib/api'
import { NUMERIC_TYPES } from '../../../lib/typeUtils'

interface RowFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: Record<string, string | null>) => Promise<void>
  columns: SchemaColumn[]
  initial?: Record<string, unknown>
  mode: 'add' | 'edit'
  focusColumn?: string
  bulkCount?: number
  isAllSelected?: boolean
  totalCount?: number | null
}

const BOOL_TYPES = new Set(['bool', 'boolean'])
const TIMESTAMP_TYPES = new Set(['timestamp', 'timestamptz', 'date'])

function inputType(colType: string): string {
  const t = colType.toLowerCase().split('(')[0].trim()
  if (BOOL_TYPES.has(t)) return 'checkbox'
  if (NUMERIC_TYPES.has(t)) return 'number'
  if (TIMESTAMP_TYPES.has(t)) return 'datetime-local'
  return 'text'
}

function isAutoColumn(col: SchemaColumn): boolean {
  // Skip serial/identity PKs on insert — they self-generate
  const t = col.type.toLowerCase()
  return col.isPrimary && (t.includes('serial') || t.includes('int'))
}

export function RowForm({ open, onClose, onSubmit, columns, initial, mode, focusColumn, bulkCount, isAllSelected, totalCount }: RowFormProps) {
  const editableCols = mode === 'add'
    ? columns.filter((c) => !isAutoColumn(c))
    : columns

  const isBulkEdit = bulkCount && bulkCount > 1

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    editableCols.forEach((c) => {
      const v = initial?.[c.name]
      init[c.name] = v === null || v === undefined ? '' : String(v)
    })
    return init
  })
  const [submitting, setSubmitting] = useState(false)
  const focusRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && focusColumn && focusRef.current) {
      setTimeout(() => focusRef.current?.focus(), 100)
    }
  }, [open, focusColumn])

  const handleSubmit = async () => {
    setSubmitting(true)
    const out: Record<string, string | null> = {}
    editableCols.forEach((c) => {
      // Skip PK and unique constrained fields in edit mode
      if (mode === 'edit' && c.isPrimary) {
        return
      }
      // Skip unique constrained fields in bulk edit mode
      if (isBulkEdit && c.isUnique) {
        return
      }
      const v = values[c.name]
      out[c.name] = v === '' ? null : v
    })
    await onSubmit(out)
    setSubmitting(false)
  }

  const title = mode === 'add'
    ? 'Add row'
    : isBulkEdit
      ? isAllSelected && totalCount
        ? `Edit all ${totalCount.toLocaleString()} rows`
        : `Edit ${bulkCount} rows`
      : 'Edit row'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-lg"
    >
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
        {editableCols.map((col) => {
          const itype = inputType(col.type)
          const isReadOnly = (mode === 'edit' && col.isPrimary) || (!!isBulkEdit && col.isUnique)

          if (itype === 'checkbox') {
            return (
              <label key={col.name} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values[col.name] === 'true'}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [col.name]: e.target.checked ? 'true' : 'false' }))
                  }
                  disabled={isReadOnly}
                  className="accent-[var(--accent)] w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div>
                  <span className="text-[13px] text-[var(--fg)]">{col.name}</span>
                  <span className="ml-2 text-[10px] text-[var(--fg-faint)] font-mono">{col.type}</span>
                  {isReadOnly && <span className="ml-2 text-[10px] text-[var(--warning)]">read-only</span>}
                </div>
              </label>
            )
          }

          return (
            <Input
              key={col.name}
              label={`${col.name} · ${col.type}${col.isPrimary ? ' · PK' : ''}${col.isUnique ? ' · UNIQUE' : ''}${col.nullable ? '' : ' · required'}${isReadOnly ? ' · read-only' : ''}`}
              type={itype}
              value={values[col.name] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [col.name]: e.target.value }))}
              placeholder={col.nullable ? 'NULL' : ''}
              ref={col.name === focusColumn ? focusRef : undefined}
              disabled={isReadOnly}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[var(--border)]">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Modal>
  )
}
