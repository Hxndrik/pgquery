import { useState, useCallback } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { TrashIcon, CheckIcon, ConnectionIcon } from '../icons'
import { useConnectionStore } from '../../stores/connectionStore'
import { parseConnectionUrl, buildConnectionUrl, type ConnectionFields } from '../../lib/connectionParser'
import { testConnection } from '../../lib/api'
import { toast } from 'sonner'

interface ConnectionManagerProps {
  open: boolean
  onClose: () => void
}

type Mode = 'url' | 'form'

function ConnectionForm({
  onConnect,
  initial,
  isEdit,
}: {
  onConnect: (url: string, name: string) => void
  initial?: { url: string; name: string }
  isEdit?: boolean
}) {
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [fields, setFields] = useState<ConnectionFields>(parseConnectionUrl(initial?.url ?? ''))
  const [testing, setTesting] = useState(false)

  const syncFromUrl = useCallback((u: string) => {
    setUrl(u)
    setFields(parseConnectionUrl(u))
  }, [])

  const syncFromFields = useCallback((f: ConnectionFields) => {
    setFields(f)
    setUrl(buildConnectionUrl(f))
  }, [])

  const handleTest = async () => {
    if (!url) return
    setTesting(true)
    const result = await testConnection(url)
    setTesting(false)
    if (result.ok) {
      toast.success(`Connected: ${result.version} — ${result.database}`)
    } else {
      toast.error(result.error ?? 'Connection failed')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-[var(--bg-hover)] rounded">
        {(['url', 'form'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 text-[12px] font-medium rounded transition-colors ${
              mode === m
                ? 'bg-[var(--bg-card)] text-[var(--fg)] shadow-sm'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            {m === 'url' ? 'URL' : 'Form'}
          </button>
        ))}
      </div>

      {mode === 'url' ? (
        <Input
          label="Connection URL"
          placeholder="postgres://user:pass@host:5432/db"
          value={url}
          onChange={(e) => syncFromUrl(e.target.value)}
          type="text"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input
              label="Host"
              value={fields.host}
              onChange={(e) => syncFromFields({ ...fields, host: e.target.value })}
            />
          </div>
          <Input label="Port" value={fields.port} onChange={(e) => syncFromFields({ ...fields, port: e.target.value })} />
          <Input label="Database" value={fields.database} onChange={(e) => syncFromFields({ ...fields, database: e.target.value })} />
          <Input label="User" value={fields.user} onChange={(e) => syncFromFields({ ...fields, user: e.target.value })} />
          <Input label="Password" type="password" value={fields.password} onChange={(e) => syncFromFields({ ...fields, password: e.target.value })} />
          <div className="col-span-2 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fields.ssl}
                onChange={(e) => syncFromFields({ ...fields, ssl: e.target.checked })}
                className="accent-[var(--accent)]"
              />
              <span className="text-[13px] text-[var(--fg-muted)]">Require SSL</span>
            </label>
          </div>
        </div>
      )}

      <Input
        label="Connection name (optional)"
        placeholder="My production DB"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleTest} disabled={!url || testing}>
          {testing ? 'Testing…' : 'Test connection'}
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => onConnect(url, name || (url.split('@').pop()?.split('/').pop() ?? 'Connection'))}
          disabled={!url}
        >
          {isEdit ? 'Update' : 'Connect'}
        </Button>
      </div>
    </div>
  )
}

export function ConnectionManager({ open, onClose }: ConnectionManagerProps) {
  const { connections, activeConnectionId, status, addConnection, updateConnection, deleteConnection, setActiveConnection, setStatus } =
    useConnectionStore()
  const [editing, setEditing] = useState<string | null>(null)

  const editingConnection = editing ? connections.find((c) => c.id === editing) : null

  const handleConnect = useCallback(
    async (url: string, name: string) => {
      if (editing) {
        // Update existing connection
        updateConnection(editing, name, url)
        
        // If it's the active connection, reconnect
        if (editing === activeConnectionId) {
          setStatus('connecting')
          const result = await testConnection(url)
          if (result.ok) {
            setActiveConnection(editing, url)
            setStatus('connected')
            toast.success(`Updated and reconnected to ${result.database}`)
          } else {
            setStatus('error')
            toast.error(result.error ?? 'Connection failed')
          }
        } else {
          toast.success('Connection updated')
        }
        setEditing(null)
      } else {
        // Add new connection
        const conn = addConnection(name, url)
        setStatus('connecting')
        const result = await testConnection(url)
        if (result.ok) {
          setActiveConnection(conn.id, url)
          setStatus('connected')
          toast.success(`Connected to ${result.database}`)
          onClose()
        } else {
          setStatus('error')
          toast.error(result.error ?? 'Connection failed')
        }
      }
    },
    [editing, activeConnectionId, addConnection, updateConnection, setActiveConnection, setStatus, onClose]
  )

  const handleQuickConnect = useCallback(
    async (id: string, url: string) => {
      setStatus('connecting')
      const result = await testConnection(url)
      if (result.ok) {
        setActiveConnection(id, url)
        setStatus('connected')
        toast.success(`Connected to ${result.database}`)
        onClose()
      } else {
        setStatus('error')
        toast.error(result.error ?? 'Connection failed')
      }
    },
    [setActiveConnection, setStatus, onClose]
  )

  return (
    <Modal open={open} onClose={onClose} title="Connections" width="max-w-xl">
      <div className="flex flex-col gap-6">
        {/* Saved connections */}
        {connections.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--fg-subtle)] mb-3">
              Saved connections
            </p>
            <div className="flex flex-col gap-1.5">
              {connections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] group cursor-pointer"
                  onClick={() => setEditing(c.id)}
                >
                  <ConnectionIcon size={16} className="text-[var(--fg-subtle)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--fg)] truncate">{c.name}</p>
                    <p className="text-[11px] text-[var(--fg-subtle)] truncate">{c.url.replace(/:[^:@]+@/, ':***@')}</p>
                  </div>
                  {activeConnectionId === c.id && status === 'connected' && (
                    <Badge variant="success" className="shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
                      live
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleQuickConnect(c.id, c.url)}
                      className="p-1 text-[var(--fg-subtle)] hover:text-[var(--fg)] rounded hover:bg-[var(--bg-card)]"
                      title="Connect"
                    >
                      <CheckIcon size={14} />
                    </button>
                    <button
                      onClick={() => deleteConnection(c.id)}
                      className="p-1 text-[var(--fg-subtle)] hover:text-[var(--error)] rounded hover:bg-[var(--bg-card)]"
                      title="Delete"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection form (new or edit) */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--fg-subtle)] mb-3">
            {editing ? 'Edit connection' : 'New connection'}
          </p>
          <ConnectionForm
            key={editing ?? 'new'}
            onConnect={handleConnect}
            initial={editingConnection ? { url: editingConnection.url, name: editingConnection.name } : undefined}
            isEdit={!!editing}
          />
        </div>
      </div>
    </Modal>
  )
}
