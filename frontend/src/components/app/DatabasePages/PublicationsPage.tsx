import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listPublications } from '../../../lib/pgCatalogQueries'
import { createPublication, dropPublication } from '../../../lib/ddlGenerators'
import { ObjectListPage } from './shared/ObjectListPage'
import { DDLPreviewModal } from './shared/DDLPreviewModal'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Modal } from '../../ui/Modal'
import { PublicationIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface Publication {
  name: string
  all_tables: boolean
  insert: boolean
  update: boolean
  delete: boolean
  truncate: boolean
  tables: string[] | null
}

const DML_OPS = ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] as const
type DmlOp = (typeof DML_OPS)[number]

export default function PublicationsPage({ connectionUrl }: PageProps) {
  const [items, setItems] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)

  // Create form state
  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formAllTables, setFormAllTables] = useState(false)
  const [formTables, setFormTables] = useState('')
  const [formOps, setFormOps] = useState<Set<DmlOp>>(new Set(DML_OPS))

  // DDL modal state
  const [ddlOpen, setDdlOpen] = useState(false)
  const [ddlSql, setDdlSql] = useState('')
  const [ddlTitle, setDdlTitle] = useState('')
  const [ddlLoading, setDdlLoading] = useState(false)
  const [ddlError, setDdlError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const catalogQuery = listPublications()
    const result = await queryRecords(connectionUrl, catalogQuery.query, catalogQuery.params ?? [])
    if (result.success) {
      setItems(
        result.data.map((row) => ({
          name: String(row.name ?? ''),
          all_tables: row.all_tables === true || row.all_tables === 't',
          insert: row.insert === true || row.insert === 't',
          update: row.update === true || row.update === 't',
          delete: row.delete === true || row.delete === 't',
          truncate: row.truncate === true || row.truncate === 't',
          tables: row.tables != null ? (Array.isArray(row.tables) ? (row.tables as string[]) : String(row.tables).replace(/[{}]/g, '').split(',').filter(Boolean)) : null,
        }))
      )
    } else {
      toast.error(`Failed to load publications: ${result.error}`)
    }
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = () => {
    setFormName('')
    setFormAllTables(false)
    setFormTables('')
    setFormOps(new Set(DML_OPS))
    setCreateOpen(true)
  }

  const toggleOp = (op: DmlOp) => {
    setFormOps((prev) => {
      const next = new Set(prev)
      if (next.has(op)) {
        next.delete(op)
      } else {
        next.add(op)
      }
      return next
    })
  }

  const handleCreateSubmit = () => {
    if (!formName.trim()) {
      toast.error('Publication name is required')
      return
    }

    const tables = formAllTables
      ? undefined
      : formTables
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => {
            const parts = t.split('.')
            if (parts.length === 2) {
              return { schema: parts[0], name: parts[1] }
            }
            return { name: t }
          })

    const ops = formOps.size > 0 && formOps.size < DML_OPS.length
      ? Array.from(formOps) as ('INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE')[]
      : undefined

    const sql = createPublication({
      name: formName.trim(),
      forAllTables: formAllTables,
      tables: tables && tables.length > 0 ? tables : undefined,
      operations: ops,
    })

    setCreateOpen(false)
    setDdlError(null)
    setDdlTitle('Create Publication')
    setDdlSql(sql)
    setDdlOpen(true)
  }

  const handleDrop = (pub: Publication) => {
    const sql = dropPublication({ name: pub.name, ifExists: true })
    setDdlError(null)
    setDdlTitle(`Drop Publication: ${pub.name}`)
    setDdlSql(sql)
    setDdlOpen(true)
  }

  const handleExecute = async () => {
    setDdlLoading(true)
    setDdlError(null)
    const result = await executeQuery(connectionUrl, ddlSql)
    if (result.success) {
      toast.success('Publication operation completed successfully')
      setDdlOpen(false)
      fetchData()
    } else {
      setDdlError(result.error.error)
    }
    setDdlLoading(false)
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (pub: Publication) => (
        <span className="font-medium text-[var(--fg)]">{pub.name}</span>
      ),
    },
    {
      key: 'all_tables',
      header: 'All Tables',
      width: '10%',
      render: (pub: Publication) =>
        pub.all_tables ? (
          <Badge variant="accent">all tables</Badge>
        ) : (
          <span className="text-[11px] text-[var(--fg-faint)]">--</span>
        ),
    },
    {
      key: 'operations',
      header: 'Operations',
      width: '30%',
      render: (pub: Publication) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {pub.insert && <Badge variant="success">ins</Badge>}
          {pub.update && <Badge variant="success">upd</Badge>}
          {pub.delete && <Badge variant="warning">del</Badge>}
          {pub.truncate && <Badge variant="warning">trunc</Badge>}
        </div>
      ),
    },
    {
      key: 'tables',
      header: 'Tables',
      render: (pub: Publication) => (
        <span className="text-[var(--fg-muted)] font-sans text-[12px]">
          {pub.all_tables
            ? 'All'
            : pub.tables && pub.tables.length > 0
              ? pub.tables.join(', ')
              : 'None'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '90px',
      render: (pub: Publication) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleDrop(pub)
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
        title="Publications"
        icon={<PublicationIcon size={18} />}
        items={items}
        columns={columns}
        keyExtractor={(pub) => pub.name}
        loading={loading}
        onRefresh={fetchData}
        onCreate={handleCreate}
        createLabel="Create Publication"
        emptyMessage="No publications found."
        searchPlaceholder="Filter publications by name..."
      />

      {/* Create publication form */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Publication"
        width="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Publication Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="my_publication"
          />
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formAllTables}
                onChange={(e) => setFormAllTables(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              <span className="text-[13px] text-[var(--fg)]">For all tables</span>
            </label>
          </div>
          {!formAllTables && (
            <Input
              label="Tables (comma-separated, e.g. public.users, public.orders)"
              value={formTables}
              onChange={(e) => setFormTables(e.target.value)}
              placeholder="public.users, public.orders"
            />
          )}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] mb-2 block">
              DML Operations
            </label>
            <div className="flex items-center gap-4">
              {DML_OPS.map((op) => (
                <label key={op} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formOps.has(op)}
                    onChange={() => toggleOp(op)}
                    className="accent-[var(--accent)]"
                  />
                  <span className="text-[13px] text-[var(--fg)]">{op}</span>
                </label>
              ))}
            </div>
          </div>
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
