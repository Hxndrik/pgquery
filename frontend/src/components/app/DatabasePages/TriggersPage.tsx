import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listTriggers, listSchemas } from '../../../lib/pgCatalogQueries'
import {
  createTrigger,
  dropTrigger,
  alterTriggerEnabled,
} from '../../../lib/ddlGenerators'
import { ObjectListPage, DDLPreviewModal, DefinitionViewer } from './shared'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { TriggerIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface TriggerItem {
  name: string
  table_name: string
  schema: string
  definition: string
  enabled: string
}

interface CreateFormState {
  name: string
  schema: string
  table: string
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
  events: Set<'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE'>
  forEach: 'ROW' | 'STATEMENT'
  functionName: string
  when: string
}

const defaultForm: CreateFormState = {
  name: '',
  schema: 'public',
  table: '',
  timing: 'BEFORE',
  events: new Set(['INSERT']),
  forEach: 'ROW',
  functionName: '',
  when: '',
}

export default function TriggersPage({ connectionUrl }: PageProps) {
  const [items, setItems] = useState<TriggerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [schemas, setSchemas] = useState<string[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<TriggerItem | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateFormState>(defaultForm)

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
      const trgQuery = listTriggers()
      const schemaQuery = listSchemas()
      const [trgResult, schemaResult] = await Promise.all([
        queryRecords(connectionUrl, trgQuery.query, trgQuery.params ?? []),
        queryRecords(connectionUrl, schemaQuery.query, schemaQuery.params ?? []),
      ])

      if (trgResult.success) {
        const rows = trgResult.data.map((row) => ({
          name: String(row.name ?? ''),
          table_name: String(row.table_name ?? ''),
          schema: String(row.schema ?? ''),
          definition: String(row.definition ?? ''),
          enabled: String(row.enabled ?? ''),
        }))
        setItems(rows)
      } else {
        toast.error(`Failed to load triggers: ${trgResult.error}`)
      }

      if (schemaResult.success) {
        setSchemas(schemaResult.data.map((row) => String(row.name ?? '')))
      }
    } catch {
      toast.error('Failed to load triggers')
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

  const handleRowClick = (item: TriggerItem) => {
    setSelectedItem(
      selectedItem?.name === item.name &&
        selectedItem?.schema === item.schema &&
        selectedItem?.table_name === item.table_name
        ? null
        : item
    )
  }

  const handleToggle = (item: TriggerItem) => {
    const enable = item.enabled !== 'enabled'
    const sql = alterTriggerEnabled({
      name: item.name,
      schema: item.schema,
      table: item.table_name,
      enable,
    })
    setDdlError(null)
    setDdlModal({
      open: true,
      title: enable ? 'Enable Trigger' : 'Disable Trigger',
      sql,
    })
  }

  const handleCreate = () => {
    if (!form.name.trim() || !form.table.trim() || !form.functionName.trim()) {
      toast.error('Name, table, and function name are required')
      return
    }
    if (form.events.size === 0) {
      toast.error('At least one event is required')
      return
    }
    const sql = createTrigger({
      name: form.name,
      schema: form.schema || undefined,
      table: form.table,
      timing: form.timing,
      events: Array.from(form.events),
      forEach: form.forEach,
      functionName: form.functionName,
      when: form.when || undefined,
    })
    setShowCreate(false)
    setDdlError(null)
    setDdlModal({ open: true, title: 'Create Trigger', sql })
  }

  const handleDrop = (item: TriggerItem) => {
    const sql = dropTrigger({
      name: item.name,
      schema: item.schema,
      table: item.table_name,
      ifExists: true,
    })
    setDdlError(null)
    setDdlModal({ open: true, title: 'Drop Trigger', sql })
  }

  const executeDDL = async () => {
    setDdlLoading(true)
    setDdlError(null)
    const result = await executeQuery(connectionUrl, ddlModal.sql)
    setDdlLoading(false)
    if (result.success) {
      toast.success('Statement executed successfully')
      setDdlModal({ open: false, title: '', sql: '' })
      setSelectedItem(null)
      loadData()
    } else {
      setDdlError(result.error.error)
    }
  }

  const toggleEvent = (event: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE') => {
    const next = new Set(form.events)
    if (next.has(event)) {
      next.delete(event)
    } else {
      next.add(event)
    }
    setForm({ ...form, events: next })
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      width: '25%',
      render: (item: TriggerItem) => (
        <span className="font-semibold">{item.name}</span>
      ),
    },
    {
      key: 'table_name',
      header: 'Table',
      width: '20%',
      render: (item: TriggerItem) => item.table_name,
    },
    {
      key: 'schema',
      header: 'Schema',
      width: '12%',
      render: (item: TriggerItem) => (
        <span className="text-[var(--fg-muted)]">{item.schema}</span>
      ),
    },
    {
      key: 'enabled',
      header: 'Status',
      width: '12%',
      render: (item: TriggerItem) => (
        <span
          className={
            item.enabled === 'enabled'
              ? 'text-[var(--success)]'
              : 'text-[var(--fg-faint)]'
          }
        >
          {item.enabled}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      render: (item: TriggerItem) => (
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggle(item)
            }}
            className="text-[11px] text-[var(--accent)] hover:underline"
          >
            {item.enabled === 'enabled' ? 'Disable' : 'Enable'}
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
      <div className="flex flex-col h-full">
        <ObjectListPage
          title="Triggers"
          icon={<TriggerIcon size={18} />}
          items={filteredItems}
          columns={columns}
          keyExtractor={(item) => `${item.schema}.${item.table_name}.${item.name}`}
          loading={loading}
          onRefresh={loadData}
          onCreate={() => {
            setForm({ ...defaultForm, events: new Set(['INSERT']) })
            setShowCreate(true)
          }}
          createLabel="Create Trigger"
          onRowClick={handleRowClick}
          selectedKey={
            selectedItem
              ? `${selectedItem.schema}.${selectedItem.table_name}.${selectedItem.name}`
              : null
          }
          schemas={schemas}
          selectedSchema={selectedSchema}
          onSchemaChange={setSelectedSchema}
          emptyMessage="No triggers found."
          searchPlaceholder="Filter triggers..."
        />

        {selectedItem && (
          <div className="border-t border-[var(--border)] p-5">
            <DefinitionViewer
              definition={selectedItem.definition}
              title="Trigger Definition"
            />
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Trigger"
        width="max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="my_trigger"
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
          <Input
            label="Table"
            value={form.table}
            onChange={(e) => setForm({ ...form, table: e.target.value })}
            placeholder="users"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
                Timing
              </label>
              <select
                value={form.timing}
                onChange={(e) =>
                  setForm({
                    ...form,
                    timing: e.target.value as CreateFormState['timing'],
                  })
                }
                className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="BEFORE">BEFORE</option>
                <option value="AFTER">AFTER</option>
                <option value="INSTEAD OF">INSTEAD OF</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
                For Each
              </label>
              <select
                value={form.forEach}
                onChange={(e) =>
                  setForm({
                    ...form,
                    forEach: e.target.value as 'ROW' | 'STATEMENT',
                  })
                }
                className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="ROW">ROW</option>
                <option value="STATEMENT">STATEMENT</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
              Events
            </label>
            <div className="flex items-center gap-3">
              {(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] as const).map((evt) => (
                <label key={evt} className="flex items-center gap-1.5 text-[13px] text-[var(--fg)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.events.has(evt)}
                    onChange={() => toggleEvent(evt)}
                    className="accent-[var(--accent)]"
                  />
                  {evt}
                </label>
              ))}
            </div>
          </div>
          <Input
            label="Function Name"
            value={form.functionName}
            onChange={(e) => setForm({ ...form, functionName: e.target.value })}
            placeholder="my_trigger_function"
          />
          <Input
            label="When Condition (optional)"
            value={form.when}
            onChange={(e) => setForm({ ...form, when: e.target.value })}
            placeholder="OLD.* IS DISTINCT FROM NEW.*"
          />
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
