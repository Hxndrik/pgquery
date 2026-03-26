import { useState, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { parseConnectionUrl, buildConnectionUrl, extractDbName, type ConnectionFields } from '../../lib/connectionParser'
import { testConnection } from '../../lib/api'
import { toast } from 'sonner'
import type { ConnectionFormProps } from '../../lib/connectionRegistry'
import type { PostgresConfig } from '../../lib/connectionTypes'
import { isPostgresConfig } from '../../lib/connectionTypes'

type Mode = 'url' | 'form'

export default function PostgresConnectionForm({ onConnect, initial, isEdit }: ConnectionFormProps) {
  const initialUrl = initial && isPostgresConfig(initial.config) ? initial.config.url : ''
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState(initialUrl)
  const [name, setName] = useState(initial?.name ?? '')
  const [fields, setFields] = useState<ConnectionFields>(parseConnectionUrl(initialUrl))
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

  const handleConnect = () => {
    const config: PostgresConfig = { url }
    onConnect(config, name || extractDbName(url) || 'Connection')
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
          onClick={handleConnect}
          disabled={!url}
        >
          {isEdit ? 'Update' : 'Connect'}
        </Button>
      </div>
    </div>
  )
}
