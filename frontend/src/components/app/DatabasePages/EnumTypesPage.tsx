import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listEnumTypes, listSchemas } from '../../../lib/pgCatalogQueries'
import { createEnum, alterEnumAddValue, dropType } from '../../../lib/ddlGenerators'
import { ObjectListPage, DDLPreviewModal } from './shared'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { EnumIcon, PlusIcon, CloseIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface EnumItem {
  name: string
  schema: string
  values: string[]
}

interface CreateFormState {
  name: string
  schema: string
  values: string[]
  newValue: string
}

const defaultForm: CreateFormState = {
  name: '',
  schema: 'public',
  values: [],
  newValue: '',
}

interface AddValueFormState {
  enumName: string
  enumSchema: string
  value: string
}

export default function EnumTypesPage({ connectionUrl }: PageProps) {
  const [items, setItems] = useState<EnumItem[]>([])
  const [loading, setLoading] = useState(true)
  const [schemas, setSchemas] = useState<string[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateFormState>(defaultForm)

  // Add value modal
  const [showAddValue, setShowAddValue] = useState(false)
  const [addValueForm, setAddValueForm] = useState<AddValueFormState>({
    enumName: '',
    enumSchema: '',
    value: '',
  })

  // DDL preview
  const [ddlModal, setDdlModal] = useState<{ open: boolean; title: string; sql: string }>({
    open: false,
    title: '',
    sql: '',
  })
  const [ddlLoading, setDdlLoading] = useState(false)
  const [ddlError, setDdlError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const enumQuery = listEnumTypes()
      const schemaQuery = listSchemas()
      const [enumResult, schemaResult] = await Promise.all([
        queryRecords(connectionUrl, enumQuery.query, enumQuery.params ?? []),
        queryRecords(connectionUrl, schemaQuery.query, schemaQuery.params ?? []),
      ])

      if (enumResult.success) {
        const rows = enumResult.data.map((row) => {
          const rawValues = row.values
          let values: string[] = []
          if (Array.isArray(rawValues)) {
            values = rawValues.map(String)
          } else if (typeof rawValues === 'string') {
            // PostgreSQL array literal: {val1,val2,val3}
            const trimmed = rawValues.replace(/^\{|\}$/g, '')
            values = trimmed ? trimmed.split(',').map((v) => v.trim()) : []
          }
          return {
            schema: String(row.schema ?? ''),
            name: String(row.name ?? ''),
            values,
          }
        })
        setItems(rows)
      } else {
        toast.error(`Failed to load enum types: ${enumResult.error}`)
      }

      if (schemaResult.success) {
        setSchemas(schemaResult.data.map((row) => String(row.name ?? '')))
      }
    } catch {
      toast.error('Failed to load enum types')
    } finally {
      setLoading(false)
    }
  }, [connectionUrl])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredItems = selectedSchema
    ? items.filter((item) => item.schema === selectedSchema)
    : items

  const handleAddFormValue = () => {
    const val = form.newValue.trim()
    if (!val) return
    if (form.values.includes(val)) {
      toast.error('Duplicate value')
      return
    }
    setForm({ ...form, values: [...form.values, val], newValue: '' })
  }

  const handleRemoveFormValue = (index: number) => {
    setForm({ ...form, values: form.values.filter((_, i) => i !== index) })
  }

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error('Type name is required')
      return
    }
    if (form.values.length === 0) {
      toast.error('At least one value is required')
      return
    }
    const sql = createEnum({
      schema: form.schema || undefined,
      name: form.name,
      values: form.values,
    })
    setShowCreate(false)
    setDdlError(null)
    setDdlModal({ open: true, title: 'Create Enum Type', sql })
  }

  const handleAddValue = (item: EnumItem) => {
    setAddValueForm({ enumName: item.name, enumSchema: item.schema, value: '' })
    setShowAddValue(true)
  }

  const handleAddValueSubmit = () => {
    if (!addValueForm.value.trim()) {
      toast.error('Value is required')
      return
    }
    const sql = alterEnumAddValue({
      schema: addValueForm.enumSchema || undefined,
      name: addValueForm.enumName,
      value: addValueForm.value,
      ifNotExists: true,
    })
    setShowAddValue(false)
    setDdlError(null)
    setDdlModal({ open: true, title: 'Add Enum Value', sql })
  }

  const handleDrop = (item: EnumItem) => {
    const sql = dropType({
      schema: item.schema,
      name: item.name,
      ifExists: true,
      cascade: false,
    })
    setDdlError(null)
    setDdlModal({ open: true, title: 'Drop Enum Type', sql })
  }

  const executeDDL = async () => {
    setDdlLoading(true)
    setDdlError(null)
    const result = await executeQuery(connectionUrl, ddlModal.sql)
    setDdlLoading(false)
    if (result.success) {
      toast.success('Statement executed successfully')
      setDdlModal({ open: false, title: '', sql: '' })
      loadData()
    } else {
      setDdlError(result.error.error)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      width: '25%',
      render: (item: EnumItem) => (
        <span className="font-semibold">{item.name}</span>
      ),
    },
    {
      key: 'schema',
      header: 'Schema',
      width: '12%',
      render: (item: EnumItem) => (
        <span className="text-[var(--fg-muted)]">{item.schema}</span>
      ),
    },
    {
      key: 'values',
      header: 'Values',
      render: (item: EnumItem) => (
        <span className="text-[var(--fg-muted)] font-sans">
          {item.values.join(', ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '160px',
      render: (item: EnumItem) => (
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAddValue(item)
            }}
            className="text-[11px] text-[var(--accent)] hover:underline"
          >
            Add Value
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDrop(item)
            }}
            className="text-[11px] text-[var(--error)] hover:underline"
          >
            Drop
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <ObjectListPage
        title="Enumerated Types"
        icon={<EnumIcon size={18} />}
        items={filteredItems}
        columns={columns}
        keyExtractor={(item) => `${item.schema}.${item.name}`}
        loading={loading}
        onRefresh={loadData}
        onCreate={() => {
          setForm(defaultForm)
          setShowCreate(true)
        }}
        createLabel="Create Enum"
        schemas={schemas}
        selectedSchema={selectedSchema}
        onSchemaChange={setSelectedSchema}
        emptyMessage="No enum types found."
        searchPlaceholder="Filter enum types..."
      />

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Enum Type"
        width="max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="my_status"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
                Schema
              </label>
              <select
                value={form.schema}
                onChange={(e) => setForm({ ...form, schema: e.target.value })}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
              >
                {schemas.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Values list */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
              Values
            </label>
            {form.values.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {form.values.map((val, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-raised)] border border-[var(--border)] text-[13px] text-[var(--fg)]"
                  >
                    {val}
                    <button
                      onClick={() => handleRemoveFormValue(i)}
                      className="text-[var(--fg-faint)] hover:text-[var(--error)] transition-colors"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={form.newValue}
                  onChange={(e) => setForm({ ...form, newValue: e.target.value })}
                  placeholder="Enter a value..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddFormValue()
                    }
                  }}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleAddFormValue}>
                <PlusIcon size={14} />
                Add
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Preview DDL
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add value modal */}
      <Modal
        open={showAddValue}
        onClose={() => setShowAddValue(false)}
        title={`Add Value to ${addValueForm.enumSchema}.${addValueForm.enumName}`}
        width="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="New Value"
            value={addValueForm.value}
            onChange={(e) => setAddValueForm({ ...addValueForm, value: e.target.value })}
            placeholder="new_value"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddValueSubmit()
              }
            }}
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddValue(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddValueSubmit}>
              Preview DDL
            </Button>
          </div>
        </div>
      </Modal>

      {/* DDL preview */}
      <DDLPreviewModal
        open={ddlModal.open}
        onClose={() => setDdlModal({ open: false, title: '', sql: '' })}
        onExecute={executeDDL}
        title={ddlModal.title}
        sql={ddlModal.sql}
        loading={ddlLoading}
        error={ddlError}
      />
    </>
  )
}
