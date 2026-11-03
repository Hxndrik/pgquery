import { useState, useEffect, useRef } from 'react'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import type { SchemaColumn } from '../../../lib/api'
import { isBooleanType, isJSONType, isTrue, stringifyValue } from '../../../lib/typeUtils'

interface RowFormProps {
  open: boolean
  onClose: () => void
  /**
   * Called with the fields the user changed only: a string is sent as text and
   * Postgres parses it with the column type's input function; null is SQL NULL.
   * Untouched fields keep their value (edit) or get the column default (add).
   */
  onSubmit: (values: Record<string, string | null>) => Promise<void>
  columns: SchemaColumn[]
  /** Values as Postgres prints them (text-mode results). */
  initial?: Record<string, unknown>
  mode: 'add' | 'edit'
  focusColumn?: string
  bulkCount?: number
  isAllSelected?: boolean
  totalCount?: number | null
}

interface Field {
  value: string
  isNull: boolean
  dirty: boolean
}

const fieldClass = `
  w-full bg-[var(--bg-card)] border border-[var(--border-mid)]
  rounded-sm text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-faint)] placeholder:italic
  px-3 py-2 transition-colors
  hover:border-[var(--fg-subtle)]
  focus:outline-none focus:border-[var(--fg)] focus:shadow-[0_0_0_1px_var(--fg)]
  disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-raised)]
`

function isMultiline(col: SchemaColumn, value: string): boolean {
  return isJSONType(col.type) || col.type.endsWith('[]') || col.type === 'xml' || value.includes('\n') || value.length > 80
}

export function RowForm({ open, onClose, onSubmit, columns, initial, mode, focusColumn, bulkCount, isAllSelected, totalCount }: RowFormProps) {
  const isBulkEdit = !!bulkCount && bulkCount > 1

  const [fields, setFields] = useState<Record<string, Field>>(() => {
    const init: Record<string, Field> = {}
    columns.forEach((c) => {
      const v = initial?.[c.name]
      const isNull = mode === 'edit' && (v === null || v === undefined)
      init[c.name] = { value: isNull || v === undefined ? '' : typeof v === 'string' ? v : stringifyValue(v), isNull, dirty: false }
    })
    return init
  })
  const [submitting, setSubmitting] = useState(false)
  const focusRef = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null)

  useEffect(() => {
    if (open && focusColumn && focusRef.current) {
      setTimeout(() => focusRef.current?.focus(), 100)
    }
  }, [open, focusColumn])

  const isReadOnly = (col: SchemaColumn) => (mode === 'edit' && col.isPrimary) || (isBulkEdit && col.isUnique)

  const setValue = (name: string, value: string) =>
    setFields((f) => ({ ...f, [name]: { value, isNull: false, dirty: true } }))
  const toggleNull = (name: string) =>
    setFields((f) => ({ ...f, [name]: { ...f[name], isNull: !f[name].isNull, dirty: true } }))

  const handleSubmit = async () => {
    setSubmitting(true)
    const out: Record<string, string | null> = {}
    columns.forEach((c) => {
      const f = fields[c.name]
      if (!f?.dirty || isReadOnly(c)) return
      out[c.name] = f.isNull ? null : f.value
    })
    await onSubmit(out)
    setSubmitting(false)
  }

  const changed = columns.filter((c) => fields[c.name]?.dirty && !isReadOnly(c)).length

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
      <p className="text-[12px] text-[var(--fg-muted)] mb-4">
        {mode === 'add'
          ? 'Fields you leave untouched get the column default. Values are entered as Postgres text, e.g. 2024-02-29 13:45:30+01 or {1,2,3}.'
          : isBulkEdit
            ? 'Only the fields you change are written to every selected row.'
            : 'Only the fields you change are saved. Values are Postgres text, exactly as stored.'}
      </p>
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
        {columns.map((col) => {
          const f = fields[col.name] ?? { value: '', isNull: false, dirty: false }
          const readOnly = isReadOnly(col)
          const disabled = readOnly || f.isNull
          const placeholder = f.isNull ? 'NULL' : mode === 'add' && !f.dirty ? 'DEFAULT' : ''
          const ref = col.name === focusColumn ? focusRef : undefined
          const id = `rowform-${col.name}`
          const label = `${col.type}${col.isPrimary ? ' · PK' : ''}${col.isUnique ? ' · UNIQUE' : ''}${col.nullable ? '' : ' · required'}`

          let control
          if (isBooleanType(col.type)) {
            control = (
              <select
                id={id}
                ref={ref}
                className={fieldClass}
                value={f.isNull || (mode === 'add' && !f.dirty) ? '' : isTrue(f.value) ? 'true' : 'false'}
                onChange={(e) => setValue(col.name, e.target.value)}
                disabled={disabled}
              >
                {(f.isNull || (mode === 'add' && !f.dirty)) && <option value="">{placeholder}</option>}
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            )
          } else if (isMultiline(col, f.value)) {
            control = (
              <textarea
                id={id}
                ref={ref}
                className={`${fieldClass} font-mono resize-y min-h-[80px]`}
                value={f.isNull ? '' : f.value}
                onChange={(e) => setValue(col.name, e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                rows={4}
                spellCheck={false}
              />
            )
          } else {
            control = (
              <input
                id={id}
                ref={ref}
                type="text"
                className={`${fieldClass} font-mono`}
                value={f.isNull ? '' : f.value}
                onChange={(e) => setValue(col.name, e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                spellCheck={false}
                autoComplete="off"
              />
            )
          }

          return (
            <div key={col.name} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <label htmlFor={id} className="label truncate">
                  {col.name}
                  <span className="ml-2 font-mono font-normal normal-case tracking-normal text-[var(--fg-faint)]">{label}</span>
                  {readOnly && <span className="ml-2 font-normal normal-case tracking-normal text-[var(--fg-subtle)]">read-only</span>}
                </label>
                <span className="flex-1" />
                {col.nullable && !readOnly && (
                  <button
                    type="button"
                    onClick={() => toggleNull(col.name)}
                    aria-pressed={f.isNull}
                    title={f.isNull ? 'Enter a value instead of NULL' : 'Set to NULL'}
                    className={`shrink-0 px-1.5 py-0.5 rounded-sm border text-[10px] font-mono transition-colors ${
                      f.isNull
                        ? 'bg-[var(--accent-bg)] border-[var(--accent-border)] text-[var(--accent-text)]'
                        : 'border-[var(--border-mid)] text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:border-[var(--fg-subtle)]'
                    }`}
                  >
                    NULL
                  </button>
                )}
              </div>
              {control}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[var(--border)]">
        {mode === 'edit' && (
          <span className="mr-auto text-[11px] text-[var(--fg-subtle)]">
            {changed === 0 ? 'No changes yet' : `${changed} field${changed === 1 ? '' : 's'} changed`}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting || (mode === 'edit' && changed === 0)}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Modal>
  )
}
