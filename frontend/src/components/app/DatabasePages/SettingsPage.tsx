import { useState, useEffect, useCallback, useMemo } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listSettings } from '../../../lib/pgCatalogQueries'
import { setSession, alterSystemSet } from '../../../lib/ddlGenerators'
import { DDLPreviewModal } from './shared/DDLPreviewModal'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Badge } from '../../ui/Badge'
import { SettingsIcon, SearchIcon, EditIcon, ChevronIcon, RefreshIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface Setting {
  name: string
  setting: string
  unit: string | null
  category: string
  short_desc: string
  context: string
  vartype: string
  min_val: string | null
  max_val: string | null
  enumvals: string[] | null
  boot_val: string | null
  reset_val: string | null
}

export default function SettingsPage({ connectionUrl }: PageProps) {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [editTarget, setEditTarget] = useState<Setting | null>(null)

  // DDL modal
  const [ddlOpen, setDdlOpen] = useState(false)
  const [ddlSql, setDdlSql] = useState('')
  const [ddlTitle, setDdlTitle] = useState('')
  const [ddlLoading, setDdlLoading] = useState(false)
  const [ddlError, setDdlError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const q = listSettings()
    const result = await queryRecords(connectionUrl, q.query, q.params ?? [])
    if (result.success) {
      setSettings(
        result.data.map((row) => ({
          name: String(row.name ?? ''),
          setting: String(row.setting ?? ''),
          unit: row.unit != null ? String(row.unit) : null,
          category: String(row.category ?? 'Uncategorized'),
          short_desc: String(row.short_desc ?? ''),
          context: String(row.context ?? ''),
          vartype: String(row.vartype ?? 'string'),
          min_val: row.min_val != null ? String(row.min_val) : null,
          max_val: row.max_val != null ? String(row.max_val) : null,
          enumvals: row.enumvals != null ? (row.enumvals as string[]) : null,
          boot_val: row.boot_val != null ? String(row.boot_val) : null,
          reset_val: row.reset_val != null ? String(row.reset_val) : null,
        }))
      )
    } else {
      toast.error('Failed to load settings: ' + result.error)
    }
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const searchLower = search.toLowerCase()

  const filteredSettings = useMemo(() => {
    if (!searchLower) return settings
    return settings.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.category.toLowerCase().includes(searchLower) ||
        s.short_desc.toLowerCase().includes(searchLower)
    )
  }, [settings, searchLower])

  const groupedSettings = useMemo(() => {
    const groups = new Map<string, Setting[]>()
    for (const s of filteredSettings) {
      const existing = groups.get(s.category)
      if (existing) {
        existing.push(s)
      } else {
        groups.set(s.category, [s])
      }
    }
    return groups
  }, [filteredSettings])

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const collapseAll = () => {
    setCollapsedCategories(new Set(groupedSettings.keys()))
  }

  const expandAll = () => {
    setCollapsedCategories(new Set())
  }

  const isEditable = (s: Setting) => s.context === 'user' || s.context === 'superuser'

  const executeDDL = async () => {
    setDdlLoading(true)
    setDdlError(null)
    const result = await executeQuery(connectionUrl, ddlSql)
    if (result.success) {
      toast.success('Setting updated successfully')
      setDdlOpen(false)
      fetchSettings()
    } else {
      setDdlError(result.error.error)
    }
    setDdlLoading(false)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <span className="text-[var(--fg-muted)]"><SettingsIcon size={18} /></span>
            <h1 className="text-[14px] font-semibold text-[var(--fg)]">Settings</h1>
            {!loading && (
              <span className="text-[11px] text-[var(--fg-faint)] ml-1">
                {filteredSettings.length} settings in {groupedSettings.size} categories
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
            <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
            <Button variant="ghost" size="sm" onClick={fetchSettings} disabled={loading}>
              <RefreshIcon size={14} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <div className="max-w-md">
            <Input
              icon={<SearchIcon size={14} />}
              placeholder="Search by name, category, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-[13px] text-[var(--fg-faint)]">Loading...</span>
            </div>
          ) : filteredSettings.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-[13px] text-[var(--fg-faint)]">No settings found matching your search.</span>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {[...groupedSettings.entries()].map(([category, items]) => {
                const isCollapsed = collapsedCategories.has(category)
                return (
                  <div key={category}>
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-2 w-full px-5 py-3 bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] transition-colors text-left"
                    >
                      <ChevronIcon size={14} direction={isCollapsed ? 'right' : 'down'} />
                      <span className="text-[12px] font-semibold text-[var(--fg)]">{category}</span>
                      <span className="text-[11px] text-[var(--fg-faint)]">{items.length}</span>
                    </button>

                    {/* Settings rows */}
                    {!isCollapsed && (
                      <div className="divide-y divide-[var(--border)]">
                        {items.map((s) => (
                          <div
                            key={s.name}
                            className="flex items-start gap-4 px-5 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            {/* Name + description */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-mono font-semibold text-[var(--fg)]">
                                  {s.name}
                                </span>
                                <Badge variant={
                                  s.context === 'user' ? 'success'
                                    : s.context === 'superuser' ? 'warning'
                                    : 'neutral'
                                }>
                                  {s.context}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 leading-relaxed">
                                {s.short_desc}
                              </p>
                            </div>

                            {/* Current value */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[13px] font-mono text-[var(--fg)]">
                                {s.setting}
                              </span>
                              {s.unit && (
                                <span className="text-[11px] text-[var(--fg-faint)]">{s.unit}</span>
                              )}
                              {isEditable(s) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditTarget(s)}
                                >
                                  <EditIcon size={13} />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Setting Modal */}
      {editTarget && (
        <EditSettingModal
          setting={editTarget}
          onClose={() => setEditTarget(null)}
          onApply={(sql, title) => {
            setEditTarget(null)
            setDdlError(null)
            setDdlTitle(title)
            setDdlSql(sql)
            setDdlOpen(true)
          }}
        />
      )}

      {/* DDL Preview */}
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
// Edit Setting Modal
// ---------------------------------------------------------------------------

function EditSettingModal({
  setting,
  onClose,
  onApply,
}: {
  setting: Setting
  onClose: () => void
  onApply: (sql: string, title: string) => void
}) {
  const [value, setValue] = useState(setting.setting)
  const [scope, setScope] = useState<'session' | 'system'>('session')

  const handleApply = () => {
    const title = scope === 'session'
      ? `SET ${setting.name} (session)`
      : `ALTER SYSTEM SET ${setting.name}`

    const sql = scope === 'session'
      ? setSession({ name: setting.name, value })
      : alterSystemSet({ name: setting.name, value })

    onApply(sql, title)
  }

  const renderInput = () => {
    if (setting.vartype === 'bool') {
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
            Value
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[13px] text-[var(--fg)] cursor-pointer select-none">
              <input
                type="radio"
                name="bool-val"
                checked={value === 'on'}
                onChange={() => setValue('on')}
                className="accent-[var(--accent)]"
              />
              on
            </label>
            <label className="flex items-center gap-1.5 text-[13px] text-[var(--fg)] cursor-pointer select-none">
              <input
                type="radio"
                name="bool-val"
                checked={value === 'off'}
                onChange={() => setValue('off')}
                className="accent-[var(--accent)]"
              />
              off
            </label>
          </div>
        </div>
      )
    }

    if (setting.vartype === 'enum' && setting.enumvals) {
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
            Value
          </label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-mid)] rounded text-[13px] text-[var(--fg)] px-3 py-2 transition-colors hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)]"
          >
            {setting.enumvals.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )
    }

    if (setting.vartype === 'integer' || setting.vartype === 'real') {
      return (
        <Input
          label={`Value${setting.unit ? ` (${setting.unit})` : ''}`}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={setting.reset_val ?? ''}
        />
      )
    }

    // Default: string input
    return (
      <Input
        label={`Value${setting.unit ? ` (${setting.unit})` : ''}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={setting.reset_val ?? ''}
      />
    )
  }

  return (
    <Modal open onClose={onClose} title={`Edit: ${setting.name}`} width="max-w-md">
      <div className="flex flex-col gap-4">
        {/* Info */}
        <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed">{setting.short_desc}</p>

        <div className="flex gap-4 text-[11px] text-[var(--fg-faint)]">
          {setting.min_val != null && <span>Min: {setting.min_val}</span>}
          {setting.max_val != null && <span>Max: {setting.max_val}</span>}
          {setting.boot_val != null && <span>Boot: {setting.boot_val}</span>}
          {setting.reset_val != null && <span>Reset: {setting.reset_val}</span>}
        </div>

        {/* Value input */}
        {renderInput()}

        {/* Scope toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
            Scope
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-[13px] text-[var(--fg)] cursor-pointer select-none">
              <input
                type="radio"
                name="scope"
                checked={scope === 'session'}
                onChange={() => setScope('session')}
                className="accent-[var(--accent)]"
              />
              Session (SET)
            </label>
            <label className="flex items-center gap-1.5 text-[13px] text-[var(--fg)] cursor-pointer select-none">
              <input
                type="radio"
                name="scope"
                checked={scope === 'system'}
                onChange={() => setScope('system')}
                className="accent-[var(--accent)]"
              />
              Persistent (ALTER SYSTEM)
            </label>
          </div>
          {scope === 'system' && (
            <p className="text-[11px] text-[var(--warning)] mt-1">
              Persistent changes require a server reload or restart to take effect.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleApply}>Preview & Apply</Button>
        </div>
      </div>
    </Modal>
  )
}
