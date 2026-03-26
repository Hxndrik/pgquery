import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listIndexes, listSchemas } from '../../../lib/pgCatalogQueries'
import { createIndex, dropIndex } from '../../../lib/ddlGenerators'
import { ObjectListPage } from './shared/ObjectListPage'
import { DDLPreviewModal } from './shared/DDLPreviewModal'
import { DefinitionViewer } from './shared/DefinitionViewer'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Modal } from '../../ui/Modal'
import { IndexIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface IndexRow {
  schema: string
  table_name: string
  index_name: string
  definition: string
  size: string
  index_type: string
  is_unique: boolean
  idx_scan: number
  idx_tup_read: number
  idx_tup_fetch: number
}

export default function IndexesPage({ connectionUrl }: PageProps) {
  const [items, setItems] = useState<IndexRow[]>([])
  const [loading, setLoading] = useState(true)
  const [schemas, setSchemas] = useState<string[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)

  // Detail view
  const [selectedIndex, setSelectedIndex] = useState<IndexRow | null>(null)

  // Create form state
  const [createOpen, setCreateOpen] = useState(false)
  const [formSchema, setFormSchema] = useState('public')
  const [formTable, setFormTable] = useState('')
  const [formName, setFormName] = useState('')
  const [formColumns, setFormColumns] = useState('')
  const [formMethod, setFormMethod] = useState<'btree' | 'hash' | 'gin' | 'gist' | 'brin'>('btree')
  const [formUnique, setFormUnique] = useState(false)
  const [formConcurrently, setFormConcurrently] = useState(false)
  const [formWhere, setFormWhere] = useState('')

  // DDL modal state
  const [ddlOpen, setDdlOpen] = useState(false)
  const [ddlSql, setDdlSql] = useState('')
  const [ddlTitle, setDdlTitle] = useState('')
  const [ddlLoading, setDdlLoading] = useState(false)
  const [ddlError, setDdlError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const catalogQuery = listIndexes()
    const result = await queryRecords(connectionUrl, catalogQuery.query, catalogQuery.params ?? [])
    if (result.success) {
      setItems(
        result.data.map((row) => ({
          schema: String(row.schema ?? ''),
          table_name: String(row.table_name ?? ''),
          index_name: String(row.index_name ?? ''),
          definition: String(row.definition ?? ''),
          size: String(row.size ?? ''),
          index_type: String(row.index_type ?? ''),
          is_unique: row.is_unique === true || row.is_unique === 't',
          idx_scan: Number(row.idx_scan ?? 0),
          idx_tup_read: Number(row.idx_tup_read ?? 0),
          idx_tup_fetch: Number(row.idx_tup_fetch ?? 0),
        }))
      )
    } else {
      toast.error(`Failed to load indexes: ${result.error}`)
    }
    setLoading(false)
  }, [connectionUrl])

  const fetchSchemas = useCallback(async () => {
    const catalogQuery = listSchemas()
    const result = await queryRecords(connectionUrl, catalogQuery.query, catalogQuery.params ?? [])
    if (result.success) {
      setSchemas(result.data.map((row) => String(row.name ?? '')))
    }
  }, [connectionUrl])

  useEffect(() => {
    fetchData()
    fetchSchemas()
  }, [fetchData, fetchSchemas])

  const filteredItems = selectedSchema
    ? items.filter((idx) => idx.schema === selectedSchema)
    : items

  const handleCreate = () => {
    setFormSchema('public')
    setFormTable('')
    setFormName('')
    setFormColumns('')
    setFormMethod('btree')
    setFormUnique(false)
    setFormConcurrently(false)
    setFormWhere('')
    setCreateOpen(true)
  }

  const handleCreateSubmit = () => {
    if (!formTable.trim() || !formName.trim() || !formColumns.trim()) {
      toast.error('Table, name, and columns are required')
      return
    }
    const cols = formColumns.split(',').map((c) => c.trim()).filter(Boolean)
    const sql = createIndex({
      schema: formSchema || undefined,
      table: formTable.trim(),
      name: formName.trim(),
      columns: cols,
      method: formMethod,
      unique: formUnique,
      concurrently: formConcurrently,
      where: formWhere.trim() || undefined,
    })
    setCreateOpen(false)
    setDdlError(null)
    setDdlTitle('Create Index')
    setDdlSql(sql)
    setDdlOpen(true)
  }

  const handleDrop = (idx: IndexRow) => {
    const sql = dropIndex({
      schema: idx.schema,
      name: idx.index_name,
      ifExists: true,
      concurrently: false,
    })
    setDdlError(null)
    setDdlTitle(`Drop Index: ${idx.schema}.${idx.index_name}`)
    setDdlSql(sql)
    setDdlOpen(true)
  }

  const handleExecute = async () => {
    setDdlLoading(true)
    setDdlError(null)
    const result = await executeQuery(connectionUrl, ddlSql)
    if (result.success) {
      toast.success('Index operation completed successfully')
      setDdlOpen(false)
      setSelectedIndex(null)
      fetchData()
    } else {
      setDdlError(result.error.error)
    }
    setDdlLoading(false)
  }

  const columns = [
    {
      key: 'index_name',
      header: 'Index',
      width: '22%',
      render: (idx: IndexRow) => (
        <span className="font-medium text-[var(--fg)]">{idx.index_name}</span>
      ),
    },
    {
      key: 'table_name',
      header: 'Table',
      width: '18%',
      render: (idx: IndexRow) => (
        <span className="text-[var(--fg-muted)]">{idx.schema}.{idx.table_name}</span>
      ),
    },
    {
      key: 'index_type',
      header: 'Type',
      width: '8%',
      render: (idx: IndexRow) => (
        <Badge variant="neutral">{idx.index_type}</Badge>
      ),
    },
    {
      key: 'is_unique',
      header: 'Unique',
      width: '8%',
      render: (idx: IndexRow) =>
        idx.is_unique ? (
          <Badge variant="accent">unique</Badge>
        ) : (
          <span className="text-[11px] text-[var(--fg-faint)]">--</span>
        ),
    },
    {
      key: 'size',
      header: 'Size',
      width: '10%',
      render: (idx: IndexRow) => (
        <span className="text-[var(--fg-muted)]">{idx.size}</span>
      ),
    },
    {
      key: 'idx_scan',
      header: 'Scans',
      width: '10%',
      render: (idx: IndexRow) => (
        <span className={idx.idx_scan === 0 ? 'text-[var(--warning)]' : 'text-[var(--fg-muted)]'}>
          {idx.idx_scan.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '90px',
      render: (idx: IndexRow) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleDrop(idx)
          }}
          className="text-[var(--error)] hover:text-[var(--error)]"
        >
          Drop
        </Button>
      ),
    },
  ]

  return (
    <>
      <ObjectListPage
        title="Indexes"
        icon={<IndexIcon size={18} />}
        items={filteredItems}
        columns={columns}
        keyExtractor={(idx) => `${idx.schema}.${idx.index_name}`}
        loading={loading}
        onRefresh={fetchData}
        onCreate={handleCreate}
        createLabel="Create Index"
        onRowClick={setSelectedIndex}
        selectedKey={selectedIndex ? `${selectedIndex.schema}.${selectedIndex.index_name}` : null}
        schemas={schemas}
        selectedSchema={selectedSchema}
        onSchemaChange={setSelectedSchema}
        emptyMessage="No indexes found."
        searchPlaceholder="Filter indexes by name..."
      />

      {/* Index definition detail */}
      <Modal
        open={!!selectedIndex}
        onClose={() => setSelectedIndex(null)}
        title={selectedIndex ? `Index: ${selectedIndex.index_name}` : ''}
        width="max-w-2xl"
      >
        {selectedIndex && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Table</span>
                <p className="text-[13px] font-mono text-[var(--fg)] mt-1">{selectedIndex.schema}.{selectedIndex.table_name}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Type</span>
                <p className="text-[13px] font-mono text-[var(--fg)] mt-1">{selectedIndex.index_type}{selectedIndex.is_unique ? ' (unique)' : ''}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Size</span>
                <p className="text-[13px] font-mono text-[var(--fg)] mt-1">{selectedIndex.size}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Scans</span>
                <p className="text-[13px] font-mono text-[var(--fg)] mt-1">{selectedIndex.idx_scan.toLocaleString()}</p>
              </div>
            </div>
            <DefinitionViewer definition={selectedIndex.definition} title="Definition" language="sql" />
          </div>
        )}
      </Modal>

      {/* Create index form */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Index"
        width="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Schema"
              value={formSchema}
              onChange={(e) => setFormSchema(e.target.value)}
              placeholder="public"
            />
            <Input
              label="Table"
              value={formTable}
              onChange={(e) => setFormTable(e.target.value)}
              placeholder="my_table"
            />
          </div>
          <Input
            label="Index Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="idx_my_table_column"
          />
          <Input
            label="Columns (comma-separated)"
            value={formColumns}
            onChange={(e) => setFormColumns(e.target.value)}
            placeholder="col1, col2"
          />
          <div>
            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
              Index Type
            </label>
            <select
              value={formMethod}
              onChange={(e) => setFormMethod(e.target.value as typeof formMethod)}
              className="mt-1.5 w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="btree">B-tree</option>
              <option value="hash">Hash</option>
              <option value="gin">GIN</option>
              <option value="gist">GiST</option>
              <option value="brin">BRIN</option>
            </select>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formUnique}
                onChange={(e) => setFormUnique(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              <span className="text-[13px] text-[var(--fg)]">Unique</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formConcurrently}
                onChange={(e) => setFormConcurrently(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              <span className="text-[13px] text-[var(--fg)]">Concurrently</span>
            </label>
          </div>
          <Input
            label="WHERE Clause (optional)"
            value={formWhere}
            onChange={(e) => setFormWhere(e.target.value)}
            placeholder="active = true"
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateSubmit}>
              Preview DDL
            </Button>
          </div>
        </div>
      </Modal>

      {/* DDL preview + execute */}
      <DDLPreviewModal
        open={ddlOpen}
        onClose={() => setDdlOpen(false)}
        onExecute={handleExecute}
        title={ddlTitle}
        sql={ddlSql}
        loading={ddlLoading}
        error={ddlError}
      />
    </>
  )
}
