import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listRoles } from '../../../lib/pgCatalogQueries'
import { createRole, dropRole, grantRole, revokeRole } from '../../../lib/ddlGenerators'
import { ObjectListPage } from './shared/ObjectListPage'
import { DDLPreviewModal } from './shared/DDLPreviewModal'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Badge } from '../../ui/Badge'
import { RoleIcon, TrashIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface Role {
  name: string
  superuser: boolean
  createdb: boolean
  createrole: boolean
  login: boolean
  replication: boolean
  connlimit: number
  validuntil: string | null
  member_of: string[] | null
}

const ATTRIBUTE_LABELS: { key: keyof Pick<Role, 'superuser' | 'createdb' | 'createrole' | 'login' | 'replication'>; label: string }[] = [
  { key: 'superuser', label: 'Superuser' },
  { key: 'createdb', label: 'Create DB' },
  { key: 'createrole', label: 'Create Role' },
  { key: 'login', label: 'Login' },
  { key: 'replication', label: 'Replication' },
]

export default function RolesPage({ connectionUrl }: PageProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [dropTarget, setDropTarget] = useState<Role | null>(null)
  const [dropLoading, setDropLoading] = useState(false)
  const [dropError, setDropError] = useState<string | null>(null)
  const [membershipModal, setMembershipModal] = useState<Role | null>(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    const q = listRoles()
    const result = await queryRecords(connectionUrl, q.query, q.params ?? [])
    if (result.success) {
      setRoles(result.data as unknown as Role[])
    } else {
      toast.error('Failed to load roles: ' + result.error)
    }
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleDrop = async () => {
    if (!dropTarget) return
    setDropLoading(true)
    setDropError(null)
    const sql = dropRole({ name: dropTarget.name, ifExists: true })
    const result = await executeQuery(connectionUrl, sql)
    if (result.success) {
      toast.success(`Dropped role "${dropTarget.name}"`)
      setDropTarget(null)
      fetchRoles()
    } else {
      setDropError(result.error.error)
    }
    setDropLoading(false)
  }

  return (
    <>
      <ObjectListPage<Role>
        title="Roles"
        icon={<RoleIcon size={18} />}
        items={roles}
        columns={[
          {
            key: 'name',
            header: 'Name',
            width: '200px',
            render: (r) => <span className="font-semibold">{r.name}</span>,
          },
          {
            key: 'attributes',
            header: 'Attributes',
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                {ATTRIBUTE_LABELS.filter((a) => r[a.key]).map((a) => (
                  <Badge key={a.key} variant={a.key === 'superuser' ? 'warning' : 'accent'}>
                    {a.label}
                  </Badge>
                ))}
                {!ATTRIBUTE_LABELS.some((a) => r[a.key]) && (
                  <span className="text-[11px] text-[var(--fg-faint)]">None</span>
                )}
              </div>
            ),
          },
          {
            key: 'member_of',
            header: 'Member Of',
            width: '200px',
            render: (r) =>
              r.member_of && r.member_of.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {r.member_of.map((m) => (
                    <Badge key={m} variant="neutral">{m}</Badge>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-[var(--fg-faint)]">--</span>
              ),
          },
          {
            key: 'connlimit',
            header: 'Conn Limit',
            width: '100px',
            render: (r) => (
              <span className="text-[13px] text-[var(--fg-muted)]">
                {r.connlimit === -1 ? 'Unlimited' : r.connlimit}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            width: '120px',
            render: (r) => (
              <div className="flex items-center gap-1 justify-end">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setMembershipModal(r) }}>
                  Membership
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDropTarget(r) }}>
                  <TrashIcon size={13} />
                </Button>
              </div>
            ),
          },
        ]}
        keyExtractor={(r) => r.name}
        loading={loading}
        onRefresh={fetchRoles}
        onCreate={() => setShowCreate(true)}
        createLabel="Create Role"
        emptyMessage="No roles found."
        searchPlaceholder="Filter roles..."
      />

      {showCreate && (
        <CreateRoleModal
          connectionUrl={connectionUrl}
          existingRoles={roles}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            fetchRoles()
          }}
        />
      )}

      {dropTarget && (
        <DDLPreviewModal
          open
          onClose={() => { setDropTarget(null); setDropError(null) }}
          onExecute={handleDrop}
          title={`Drop Role "${dropTarget.name}"`}
          sql={dropRole({ name: dropTarget.name, ifExists: true })}
          loading={dropLoading}
          error={dropError}
        />
      )}

      {membershipModal && (
        <MembershipModal
          connectionUrl={connectionUrl}
          role={membershipModal}
          allRoles={roles}
          onClose={() => setMembershipModal(null)}
          onChanged={fetchRoles}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Create Role Modal
// ---------------------------------------------------------------------------

function CreateRoleModal({
  connectionUrl,
  existingRoles,
  onClose,
  onCreated,
}: {
  connectionUrl: string
  existingRoles: Role[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [connlimit, setConnlimit] = useState('')
  const [attrs, setAttrs] = useState({
    superuser: false,
    createdb: false,
    createrole: false,
    login: true,
    replication: false,
  })
  const [inRole, setInRole] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sql = createRole({
    name,
    ...attrs,
    password: password || undefined,
    connlimit: connlimit ? parseInt(connlimit, 10) : undefined,
    inRole: inRole.length > 0 ? inRole : undefined,
  })

  const handleExecute = async () => {
    setExecuting(true)
    setError(null)
    const result = await executeQuery(connectionUrl, sql)
    if (result.success) {
      toast.success(`Created role "${name}"`)
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
        title="Create Role"
        sql={sql}
        loading={executing}
        error={error}
      />
    )
  }

  return (
    <Modal open onClose={onClose} title="Create Role" width="max-w-lg">
      <div className="flex flex-col gap-4">
        <Input label="Role Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my_role" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Optional" />
        <Input label="Connection Limit" type="number" value={connlimit} onChange={(e) => setConnlimit(e.target.value)} placeholder="-1 for unlimited" />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Attributes</label>
          <div className="flex flex-wrap gap-3">
            {ATTRIBUTE_LABELS.map((a) => (
              <label key={a.key} className="flex items-center gap-1.5 text-[13px] text-[var(--fg)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={attrs[a.key]}
                  onChange={(e) => setAttrs((prev) => ({ ...prev, [a.key]: e.target.checked }))}
                  className="accent-[var(--accent)]"
                />
                {a.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Member Of</label>
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-auto">
            {existingRoles.map((r) => (
              <label key={r.name} className="flex items-center gap-1.5 text-[13px] text-[var(--fg)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inRole.includes(r.name)}
                  onChange={(e) => {
                    if (e.target.checked) setInRole((prev) => [...prev, r.name])
                    else setInRole((prev) => prev.filter((n) => n !== r.name))
                  }}
                  className="accent-[var(--accent)]"
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim()} onClick={() => setShowPreview(true)}>Preview & Execute</Button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Membership Modal (Grant / Revoke)
// ---------------------------------------------------------------------------

function MembershipModal({
  connectionUrl,
  role,
  allRoles,
  onClose,
  onChanged,
}: {
  connectionUrl: string
  role: Role
  allRoles: Role[]
  onClose: () => void
  onChanged: () => void
}) {
  const [granting, setGranting] = useState(false)
  const [selectedGrant, setSelectedGrant] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)

  const currentMemberships = role.member_of ?? []
  const availableRoles = allRoles
    .filter((r) => r.name !== role.name && !currentMemberships.includes(r.name))
    .map((r) => r.name)

  const handleGrant = async () => {
    if (!selectedGrant) return
    setGranting(true)
    const sql = grantRole({ role: selectedGrant, to: role.name })
    const result = await executeQuery(connectionUrl, sql)
    if (result.success) {
      toast.success(`Granted "${selectedGrant}" to "${role.name}"`)
      setSelectedGrant('')
      onChanged()
    } else {
      toast.error(result.error.error)
    }
    setGranting(false)
  }

  const handleRevoke = async (memberRole: string) => {
    setRevoking(memberRole)
    const sql = revokeRole({ role: memberRole, to: role.name })
    const result = await executeQuery(connectionUrl, sql)
    if (result.success) {
      toast.success(`Revoked "${memberRole}" from "${role.name}"`)
      onChanged()
    } else {
      toast.error(result.error.error)
    }
    setRevoking(null)
  }

  return (
    <Modal open onClose={onClose} title={`Membership: ${role.name}`} width="max-w-md">
      <div className="flex flex-col gap-4">
        {/* Current memberships */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Current Memberships</label>
          {currentMemberships.length === 0 ? (
            <p className="text-[13px] text-[var(--fg-faint)]">Not a member of any role.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {currentMemberships.map((m) => (
                <div key={m} className="flex items-center justify-between px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)]">
                  <span className="text-[13px] font-mono text-[var(--fg)]">{m}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revoking === m}
                    onClick={() => handleRevoke(m)}
                  >
                    {revoking === m ? 'Revoking...' : 'Revoke'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grant new */}
        {availableRoles.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Grant Role</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedGrant}
                onChange={(e) => setSelectedGrant(e.target.value)}
                className="flex-1 appearance-none bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">Select a role...</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Button size="sm" disabled={!selectedGrant || granting} onClick={handleGrant}>
                {granting ? 'Granting...' : 'Grant'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
