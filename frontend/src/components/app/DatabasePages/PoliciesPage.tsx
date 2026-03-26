import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listRlsStatusPerTable, listPoliciesForTable } from '../../../lib/pgCatalogQueries'
import { createPolicy, dropPolicy, enableRls, disableRls } from '../../../lib/ddlGenerators'
import { ObjectListPage } from './shared/ObjectListPage'
import { DDLPreviewModal } from './shared/DDLPreviewModal'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Badge } from '../../ui/Badge'
import { PolicyIcon, TrashIcon, ChevronIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface TableRlsStatus {
  schema: string
  table_name: string
  rls_enabled: boolean
  rls_forced: boolean
}

interface Policy {
  name: string
  command: string
  permissive: boolean
  using_expr: string | null
  check_expr: string | null
  roles: string[] | null
}

export default function PoliciesPage({ connectionUrl }: PageProps) {
  const [tables, setTables] = useState<TableRlsStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<TableRlsStatus | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [policiesLoading, setPoliciesLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // DDL modal
  const [ddlOpen, setDdlOpen] = useState(false)
  const [ddlSql, setDdlSql] = useState('')
  const [ddlTitle, setDdlTitle] = useState('')
  const [ddlLoading, setDdlLoading] = useState(false)
  const [ddlError, setDdlError] = useState<string | null>(null)

  // Schema filter
  const [schemas, setSchemas] = useState<string[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)

  const fetchTables = useCallback(async () => {
    setLoading(true)
    const q = listRlsStatusPerTable()
    const result = await queryRecords(connectionUrl, q.query, q.params ?? [])
    if (result.success) {
      const rows = result.data.map((row) => ({
        schema: String(row.schema ?? ''),
        table_name: String(row.table_name ?? ''),
        rls_enabled: Boolean(row.rls_enabled),
        rls_forced: Boolean(row.rls_forced),
      }))
      setTables(rows)
      const uniqueSchemas = [...new Set(rows.map((r) => r.schema))].sort()
      setSchemas(uniqueSchemas)
    } else {
      toast.error('Failed to load tables: ' + result.error)
    }
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  const fetchPolicies = useCallback(async (schema: string, table: string) => {
    setPoliciesLoading(true)
    const q = listPoliciesForTable(schema, table)
    const result = await queryRecords(connectionUrl, q.query, q.params ?? [])
    if (result.success) {
      setPolicies(
        result.data.map((row) => ({
          name: String(row.name ?? ''),
          command: String(row.command ?? 'ALL'),
          permissive: Boolean(row.permissive),
          using_expr: row.using_expr != null ? String(row.using_expr) : null,
          check_expr: row.check_expr != null ? String(row.check_expr) : null,
          roles: row.roles != null ? (row.roles as string[]) : null,
        }))
      )
    } else {
      toast.error('Failed to load policies: ' + result.error)
      setPolicies([])
    }
    setPoliciesLoading(false)
  }, [connectionUrl])

  const handleTableSelect = (table: TableRlsStatus) => {
    if (selectedTable?.schema === table.schema && selectedTable?.table_name === table.table_name) {
      setSelectedTable(null)
      setPolicies([])
    } else {
      setSelectedTable(table)
      fetchPolicies(table.schema, table.table_name)
    }
  }

  const handleToggleRls = (table: TableRlsStatus) => {
    setDdlError(null)
    if (table.rls_enabled) {
      setDdlTitle(`Disable RLS on ${table.schema}.${table.table_name}`)
      setDdlSql(disableRls({ schema: table.schema, table: table.table_name }))
    } else {
      setDdlTitle(`Enable RLS on ${table.schema}.${table.table_name}`)
      setDdlSql(enableRls({ schema: table.schema, table: table.table_name }))
    }
    setDdlOpen(true)
  }

  const handleDropPolicy = (policy: Policy) => {
    if (!selectedTable) return
    setDdlError(null)
    setDdlTitle(`Drop Policy "${policy.name}"`)
    setDdlSql(dropPolicy({
      name: policy.name,
      schema: selectedTable.schema,
      table: selectedTable.table_name,
      ifExists: true,
    }))
    setDdlOpen(true)
  }

  const executeDDL = async () => {
    setDdlLoading(true)
    setDdlError(null)
    const result = await executeQuery(connectionUrl, ddlSql)
    if (result.success) {
      toast.success('Statement executed successfully')
      setDdlOpen(false)
      fetchTables()
      if (selectedTable) {
        fetchPolicies(selectedTable.schema, selectedTable.table_name)
      }
    } else {
      setDdlError(result.error.error)
    }
    setDdlLoading(false)
  }

  const filteredTables = selectedSchema
    ? tables.filter((t) => t.schema === selectedSchema)
    : tables

  return (
    <>
      <div className="flex flex-col h-full">
        <ObjectListPage<TableRlsStatus>
          title="Row Level Security"
          icon={<PolicyIcon size={18} />}
          items={filteredTables}
          columns={[
            {
              key: 'table',
              header: 'Table',
              width: '30%',
              render: (t) => (
                <span className="font-semibold">
                  <span className="text-[var(--fg-muted)]">{t.schema}.</span>{t.table_name}
                </span>
              ),
            },
            {
              key: 'rls_status',
              header: 'RLS Status',
              width: '15%',
              render: (t) => (
                <div className="flex items-center gap-1.5">
                  <Badge variant={t.rls_enabled ? 'success' : 'neutral'}>
                    {t.rls_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {t.rls_forced && (
                    <Badge variant="warning">Forced</Badge>
                  )}
                </div>
              ),
            },
            {
              key: 'actions',
              header: '',
              width: '160px',
              render: (t) => (
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleRls(t)
                    }}
                  >
                    {t.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
                  </Button>
                </div>
              ),
            },
          ]}
          keyExtractor={(t) => `${t.schema}.${t.table_name}`}
          loading={loading}
          onRefresh={fetchTables}
          onCreate={() => {
            if (!selectedTable) {
              toast.error('Select a table first to create a policy')
              return
            }
            setShowCreate(true)
          }}
          createLabel="Create Policy"
          onRowClick={handleTableSelect}
          selectedKey={
            selectedTable
              ? `${selectedTable.schema}.${selectedTable.table_name}`
              : null
          }
          schemas={schemas}
          selectedSchema={selectedSchema}
          onSchemaChange={setSelectedSchema}
          emptyMessage="No tables found."
          searchPlaceholder="Filter tables..."
        />

        {/* Policies panel for selected table */}
        {selectedTable && (
          <div className="border-t border-[var(--border)] flex-shrink-0">
            <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-raised)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ChevronIcon size={14} direction="down" />
                <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
                  Policies for {selectedTable.schema}.{selectedTable.table_name}
                </span>
                {!policiesLoading && (
                  <span className="text-[11px] text-[var(--fg-faint)]">
                    {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
              >
                Add Policy
              </Button>
            </div>

            <div className="max-h-[300px] overflow-auto">
              {policiesLoading ? (
                <div className="flex items-center justify-center h-20">
                  <span className="text-[13px] text-[var(--fg-faint)]">Loading policies...</span>
                </div>
              ) : policies.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <span className="text-[13px] text-[var(--fg-faint)]">No policies defined for this table.</span>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-raised)] border-b border-[var(--border)]">
                      <th className="text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] px-5 py-2">Name</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] px-5 py-2">Command</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] px-5 py-2">Type</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] px-5 py-2">Roles</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] px-5 py-2">USING</th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] px-5 py-2">WITH CHECK</th>
                      <th className="text-right text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)] px-5 py-2" style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((p) => (
                      <tr key={p.name} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)]">
                        <td className="text-[13px] font-mono font-semibold text-[var(--fg)] px-5 py-2.5">{p.name}</td>
                        <td className="text-[13px] font-mono text-[var(--fg)] px-5 py-2.5">
                          <Badge variant="accent">{p.command}</Badge>
                        </td>
                        <td className="text-[13px] text-[var(--fg)] px-5 py-2.5">
                          <Badge variant={p.permissive ? 'success' : 'warning'}>
                            {p.permissive ? 'Permissive' : 'Restrictive'}
                          </Badge>
                        </td>
                        <td className="text-[13px] font-mono text-[var(--fg-muted)] px-5 py-2.5">
                          {p.roles && p.roles.length > 0 ? p.roles.join(', ') : 'PUBLIC'}
                        </td>
                        <td className="text-[13px] font-mono text-[var(--fg-muted)] px-5 py-2.5 max-w-[200px] truncate" title={p.using_expr ?? ''}>
                          {p.using_expr ?? <span className="text-[var(--fg-faint)]">--</span>}
                        </td>
                        <td className="text-[13px] font-mono text-[var(--fg-muted)] px-5 py-2.5 max-w-[200px] truncate" title={p.check_expr ?? ''}>
                          {p.check_expr ?? <span className="text-[var(--fg-faint)]">--</span>}
                        </td>
                        <td className="text-right px-5 py-2.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDropPolicy(p)}
                          >
                            <TrashIcon size={13} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Policy Modal */}
      {showCreate && selectedTable && (
        <CreatePolicyModal
          connectionUrl={connectionUrl}
          schema={selectedTable.schema}
          table={selectedTable.table_name}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            fetchPolicies(selectedTable.schema, selectedTable.table_name)
          }}
        />
      )}

      {/* DDL Preview Modal */}
      <DDLPreviewModal
        open={ddlOpen}
        onClose={() => setDdlOpen(false)}
        onExecute={executeDDL}
        title={ddlTitle}
        sql={ddlSql}
        loading={ddlLoading}
        error={ddlError}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Create Policy Modal
// ---------------------------------------------------------------------------

function CreatePolicyModal({
  connectionUrl,
  schema,
  table,
  onClose,
  onCreated,
}: {
  connectionUrl: string
  schema: string
  table: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [command, setCommand] = useState<'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'>('ALL')
  const [permissive, setPermissive] = useState(true)
  const [usingExpr, setUsingExpr] = useState('')
  const [withCheck, setWithCheck] = useState('')
  const [rolesStr, setRolesStr] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roles = rolesStr.trim()
    ? rolesStr.split(',').map((r) => r.trim()).filter(Boolean)
    : undefined

  const sql = createPolicy({
    name,
    schema,
    table,
    command,
    permissive,
    roles,
    using: usingExpr || undefined,
    withCheck: withCheck || undefined,
  })

  const handleExecute = async () => {
    setExecuting(true)
    setError(null)
    const result = await executeQuery(connectionUrl, sql)
    if (result.success) {
      toast.success(`Created policy "${name}"`)
      onCreated()
    } else {
      setError(result.error.error)
    }
    setExecuting(false)
  }

  if (showPreview) {
    return (
      <DDLPreviewModal
        open
        onClose={() => setShowPreview(false)}
        onExecute={handleExecute}
        title="Create Policy"
        sql={sql}
        loading={executing}
        error={error}
      />
    )
  }

  return (
    <Modal open onClose={onClose} title={`Create Policy on ${schema}.${table}`} width="max-w-lg">
      <div className="flex flex-col gap-4">
        <Input
          label="Policy Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my_policy"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
              Command
            </label>
            <select
              value={command}
              onChange={(e) => setCommand(e.target.value as typeof command)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="ALL">ALL</option>
              <option value="SELECT">SELECT</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
              Type
            </label>
            <select
              value={permissive ? 'permissive' : 'restrictive'}
              onChange={(e) => setPermissive(e.target.value === 'permissive')}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="permissive">Permissive</option>
              <option value="restrictive">Restrictive</option>
            </select>
          </div>
        </div>

        <Input
          label="Roles (comma-separated, leave blank for PUBLIC)"
          value={rolesStr}
          onChange={(e) => setRolesStr(e.target.value)}
          placeholder="role1, role2"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
            USING Expression
          </label>
          <textarea
            value={usingExpr}
            onChange={(e) => setUsingExpr(e.target.value)}
            rows={3}
            placeholder="e.g. current_user = owner"
            className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] font-mono text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)] resize-y"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
            WITH CHECK Expression
          </label>
          <textarea
            value={withCheck}
            onChange={(e) => setWithCheck(e.target.value)}
            rows={3}
            placeholder="e.g. current_user = owner"
            className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] font-mono text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)] resize-y"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim()} onClick={() => setShowPreview(true)}>
            Preview & Execute
          </Button>
        </div>
      </div>
    </Modal>
  )
}
