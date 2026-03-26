import { useState, useEffect, useCallback } from 'react'
import { executeQuery } from '../../../lib/api'
import { listReplicationSlots, listSubscriptions } from '../../../lib/pgCatalogQueries'
import { ReplicationIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps { connectionUrl: string }

interface ReplicationSlot {
  slot_name: string
  plugin: string
  slot_type: string
  database: string
  active: boolean
  restart_lsn: string
  confirmed_flush_lsn: string
}

interface Subscription {
  name: string
  enabled: boolean
  conninfo: string
  publications: string[]
  slot_name: string
}

export default function ReplicationPage({ connectionUrl }: PageProps) {
  const [slots, setSlots] = useState<ReplicationSlot[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [subError, setSubError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setSubError(null)
    try {
      const q1 = listReplicationSlots()
      const r1 = await executeQuery(connectionUrl, q1.query)
      if (r1.success) setSlots(r1.data.rows as unknown as ReplicationSlot[])

      const q2 = listSubscriptions()
      const r2 = await executeQuery(connectionUrl, q2.query)
      if (r2.success) {
        setSubscriptions(r2.data.rows as unknown as Subscription[])
      } else {
        setSubError(r2.error.error)
      }
    } catch {
      toast.error('Failed to load replication data')
    }
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <ReplicationIcon size={20} className="text-[var(--fg-subtle)]" />
          <h1 className="text-[17px] font-semibold text-[var(--fg)]">Replication</h1>
          <button
            onClick={loadData}
            disabled={loading}
            className="ml-auto text-[13px] px-3 py-1.5 rounded bg-[var(--accent-bg)] text-[var(--accent)] hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[13px] text-[var(--fg-faint)]">Loading…</div>
        ) : (
          <>
            {/* Replication Slots */}
            <div className="mb-8">
              <h2 className="text-[14px] font-medium text-[var(--fg)] mb-3">Replication Slots</h2>
              {slots.length === 0 ? (
                <div className="text-[13px] text-[var(--fg-faint)] py-4 border border-[var(--border)] rounded-lg text-center">
                  No replication slots configured
                </div>
              ) : (
                <div className="overflow-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-raised)]">
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Slot Name</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Type</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Plugin</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Database</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Active</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Restart LSN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map((slot) => (
                        <tr key={slot.slot_name} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]">
                          <td className="px-3 py-2 font-mono text-[var(--fg)]">{slot.slot_name}</td>
                          <td className="px-3 py-2 font-mono text-[var(--fg)]">{slot.slot_type}</td>
                          <td className="px-3 py-2 font-mono text-[var(--fg-muted)]">{slot.plugin ?? '—'}</td>
                          <td className="px-3 py-2 font-mono text-[var(--fg-muted)]">{slot.database ?? '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${slot.active ? 'bg-green-500/15 text-green-500' : 'bg-yellow-500/15 text-yellow-500'}`}>
                              {slot.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[var(--fg-muted)] text-[11px]">{slot.restart_lsn ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Subscriptions */}
            <div>
              <h2 className="text-[14px] font-medium text-[var(--fg)] mb-3">Subscriptions</h2>
              {subError ? (
                <div className="text-[13px] text-[var(--fg-muted)] py-4 border border-[var(--border)] rounded-lg text-center">
                  Subscriptions require superuser: {subError}
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-[13px] text-[var(--fg-faint)] py-4 border border-[var(--border)] rounded-lg text-center">
                  No subscriptions configured
                </div>
              ) : (
                <div className="overflow-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-raised)]">
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Name</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Enabled</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Publications</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--fg-muted)]">Slot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((sub) => (
                        <tr key={sub.name} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]">
                          <td className="px-3 py-2 font-mono text-[var(--fg)]">{sub.name}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${sub.enabled ? 'bg-green-500/15 text-green-500' : 'bg-yellow-500/15 text-yellow-500'}`}>
                              {sub.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[var(--fg-muted)]">
                            {Array.isArray(sub.publications) ? sub.publications.join(', ') : String(sub.publications)}
                          </td>
                          <td className="px-3 py-2 font-mono text-[var(--fg-muted)]">{sub.slot_name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
