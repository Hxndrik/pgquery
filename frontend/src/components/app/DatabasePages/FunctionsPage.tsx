import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listFunctions, listSchemas } from '../../../lib/pgCatalogQueries'
import { createFunction, dropFunction } from '../../../lib/ddlGenerators'
import { ObjectListPage, DDLPreviewModal, DefinitionViewer } from './shared'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { FunctionIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface FunctionItem {
  name: string
  schema: string
  args: string
  return_type: string
  language: string
  volatility: string
  security_definer: boolean
  definition: string
}

interface CreateFormState {
  name: string
  schema: string
  language: string
  args: string
  returnType: string
  volatility: 'VOLATILE' | 'STABLE' | 'IMMUTABLE'
  body: string
}

const defaultForm: CreateFormState = {
  name: '',
  schema: 'public',
  language: 'plpgsql',
  args: '',
  returnType: 'void',
  volatility: 'VOLATILE',
  body: '',
}

export default function FunctionsPage({ connectionUrl }: PageProps) {
  const [items, setItems] = useState<FunctionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [schemas, setSchemas] = useState<string[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<FunctionItem | null>(null)

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
      const fnQuery = listFunctions()
      const schemaQuery = listSchemas()
      const [fnResult, schemaResult] = await Promise.all([
        queryRecords(connectionUrl, fnQuery.query, fnQuery.params ?? []),
        queryRecords(connectionUrl, schemaQuery.query, schemaQuery.params ?? []),
      ])

      if (fnResult.success) {
        const rows = fnResult.data.map((row) => ({
          name: String(row.name ?? ''),
          schema: String(row.schema ?? ''),
          args: String(row.args ?? ''),
          return_type: String(row.return_type ?? ''),
          language: String(row.language ?? ''),
          volatility: String(row.volatility ?? ''),
          security_definer: Boolean(row.security_definer),
          definition: String(row.definition ?? ''),
        }))
        setItems(rows)
      } else {
        toast.error(`Failed to load functions: ${fnResult.error}`)
      }

      if (schemaResult.success) {
        setSchemas(schemaResult.data.map((row) => String(row.name ?? '')))
      }
    } catch {
      toast.error('Failed to load functions')
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

  const handleRowClick = (item: FunctionItem) => {
    setSelectedItem(selectedItem?.name === item.name && selectedItem?.schema === item.schema && selectedItem?.args === item.args ? null : item)
  }

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error('Function name is required')
      return
    }
    const sql = createFunction({
      schema: form.schema || undefined,
      name: form.name,
      args: form.args,
      returnType: form.returnType,
      language: form.language,
      body: form.body,
      volatility: form.volatility,
      replace: true,
    })
    setShowCreate(false)
    setDdlError(null)
    setDdlModal({ open: true, title: 'Create Function', sql })
  }

  const handleDrop = (item: FunctionItem) => {
    const sql = dropFunction({
      schema: item.schema,
      name: item.name,
      args: item.args,
      ifExists: true,
      cascade: false,
    })
    setDdlError(null)
    setDdlModal({ open: true, title: 'Drop Function', sql })
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

  const columns = [
    {
      key: 'name',
      header: 'Name',
      width: '25%',
      render: (item: FunctionItem) => (
        <span className="font-semibold">{item.name}</span>
      ),
    },
    {
      key: 'schema',
      header: 'Schema',
      width: '12%',
      render: (item: FunctionItem) => (
        <span className="text-[var(--fg-muted)]">{item.schema}</span>
      ),
    },
    {
      key: 'return_type',
      header: 'Returns',
      width: '18%',
      render: (item: FunctionItem) => item.return_type,
    },
    {
      key: 'language',
      header: 'Language',
      width: '12%',
      render: (item: FunctionItem) => (
        <span className="text-[var(--fg-muted)]">{item.language}</span>
      ),
    },
    {
      key: 'volatility',
      header: 'Volatility',
      width: '12%',
      render: (item: FunctionItem) => (
        <span className="text-[var(--fg-muted)]">{item.volatility}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (item: FunctionItem) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDrop(item)
          }}
          className="text-[11px] text-[var(--error)] opacity-0 group-hover:opacity-100 hover:underline transition-opacity"
        >
          Drop
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-col h-full">
        <ObjectListPage
          title="Functions"
          icon={<FunctionIcon size={18} />}
          items={filteredItems}
          columns={columns}
          keyExtractor={(item) => `${item.schema}.${item.name}(${item.args})`}
          loading={loading}
          onRefresh={loadData}
          onCreate={() => {
            setForm(defaultForm)
            setShowCreate(true)
          }}
          createLabel="Create Function"
          onRowClick={handleRowClick}
          selectedKey={
            selectedItem
              ? `${selectedItem.schema}.${selectedItem.name}(${selectedItem.args})`
              : null
          }
          schemas={schemas}
          selectedSchema={selectedSchema}
          onSchemaChange={setSelectedSchema}
          emptyMessage="No functions found."
          searchPlaceholder="Filter functions..."
        />

        {/* Expanded definition */}
        {selectedItem && (
          <div className="border-t border-[var(--border)] p-5">
            <DefinitionViewer
              definition={selectedItem.definition}
              title="Function Definition"
              language={selectedItem.language}
            />
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Function"
        width="max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="my_function"
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
            label="Arguments"
            value={form.args}
            onChange={(e) => setForm({ ...form, args: e.target.value })}
            placeholder="arg1 text, arg2 integer"
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Returns"
              value={form.returnType}
              onChange={(e) => setForm({ ...form, returnType: e.target.value })}
              placeholder="void"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
                Language
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="plpgsql">plpgsql</option>
                <option value="sql">sql</option>
                <option value="plpython3u">plpython3u</option>
                <option value="plperl">plperl</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
                Volatility
              </label>
              <select
                value={form.volatility}
                onChange={(e) =>
                  setForm({
                    ...form,
                    volatility: e.target.value as CreateFormState['volatility'],
                  })
                }
                className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="VOLATILE">volatile</option>
                <option value="STABLE">stable</option>
                <option value="IMMUTABLE">immutable</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
              Body
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={8}
              placeholder="BEGIN&#10;  -- function body&#10;END;"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] font-mono text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)] resize-y"
            />
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
