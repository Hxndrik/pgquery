import { useState, useEffect, useCallback } from 'react'
import { queryRecords } from '../../../lib/api'
import { tablesWithoutRls, superuserRoles, publicSchemaTables } from '../../../lib/pgCatalogQueries'
import { SecurityIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps { connectionUrl: string }

interface Check {
  label: string
  description: string
  severity: 'critical' | 'warning' | 'info' | 'pass'
  items: string[]
}

export default function SecurityAdvisorPage({ connectionUrl }: PageProps) {
  const [checks, setChecks] = useState<Check[]>([])
  const [loading, setLoading] = useState(true)

  const runChecks = useCallback(async () => {
    setLoading(true)
    const results: Check[] = []

    try {
      // Check 1: Tables without RLS
      const q1 = tablesWithoutRls()
      const r1 = await queryRecords(connectionUrl, q1.query, q1.params ?? [])
      if (r1.success) {
        const tables = r1.data.map((r: Record<string, unknown>) => `${r.schema}.${r.table_name}`)
        results.push({
          label: 'Row Level Security',
          description: 'Tables without RLS enabled are accessible to any role with table-level permissions.',
          severity: tables.length > 0 ? 'warning' : 'pass',
          items: tables.length > 0
            ? tables.map((t: string) => `${t} has no RLS`)
            : ['All tables have RLS enabled'],
        })
      }

      // Check 2: Superuser roles
      const q2 = superuserRoles()
      const r2 = await queryRecords(connectionUrl, q2.query, q2.params ?? [])
      if (r2.success) {
        const roles = r2.data.map((r: Record<string, unknown>) => String(r.name))
        results.push({
          label: 'Superuser Roles',
          description: 'Superuser roles bypass all permission checks. Minimize their use.',
          severity: roles.length > 1 ? 'warning' : 'info',
          items: roles.map((r: string) => `${r} has superuser privileges`),
        })
      }

      // Check 3: Public schema objects
      const q3 = publicSchemaTables()
      const r3 = await queryRecords(connectionUrl, q3.query, q3.params ?? [])
      if (r3.success) {
        const objs = r3.data.map((r: Record<string, unknown>) => `${r.table_name} (${r.type})`)
        results.push({
          label: 'Public Schema Usage',
          description: 'Objects in the public schema are accessible by default. Consider using dedicated schemas.',
          severity: objs.length > 5 ? 'warning' : objs.length > 0 ? 'info' : 'pass',
          items: objs.length > 0
            ? objs
            : ['No objects in public schema'],
        })
      }

      // Check 4: SSL connection
      const r4 = await queryRecords(connectionUrl, "SHOW ssl", [])
      if (r4.success) {
        const sslEnabled = r4.data[0]?.ssl === 'on'
        results.push({
          label: 'SSL Connection',
          description: 'SSL encrypts data in transit between client and server.',
          severity: sslEnabled ? 'pass' : 'critical',
          items: [sslEnabled ? 'SSL is enabled' : 'SSL is not enabled — connections are unencrypted'],
        })
      }

      // Check 5: Password encryption
      const r5 = await queryRecords(connectionUrl, "SHOW password_encryption", [])
      if (r5.success) {
        const enc = String(r5.data[0]?.password_encryption ?? '')
        results.push({
          label: 'Password Encryption',
          description: 'scram-sha-256 is recommended over md5 for password hashing.',
          severity: enc === 'scram-sha-256' ? 'pass' : 'warning',
          items: [`Password encryption: ${enc}`],
        })
      }
    } catch {
      toast.error('Failed to run security checks')
    }

    setChecks(results)
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => { runChecks() }, [runChecks])

  const severityColor = (s: Check['severity']) => {
    switch (s) {
      case 'critical': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'info': return 'text-blue-400'
      case 'pass': return 'text-green-500'
    }
  }

  const severityBg = (s: Check['severity']) => {
    switch (s) {
      case 'critical': return 'bg-red-500/10 border-red-500/20'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20'
      case 'info': return 'bg-blue-500/10 border-blue-500/20'
      case 'pass': return 'bg-green-500/10 border-green-500/20'
    }
  }

  const severityLabel = (s: Check['severity']) => {
    switch (s) {
      case 'critical': return 'CRITICAL'
      case 'warning': return 'WARNING'
      case 'info': return 'INFO'
      case 'pass': return 'PASS'
    }
  }

  const score = checks.length > 0
    ? Math.round((checks.filter(c => c.severity === 'pass').length / checks.length) * 100)
    : 0

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <SecurityIcon size={20} className="text-[var(--fg-subtle)]" />
          <h1 className="text-[17px] font-semibold text-[var(--fg)]">Security Advisor</h1>
          <button
            onClick={runChecks}
            disabled={loading}
            className="ml-auto text-[13px] px-3 py-1.5 rounded bg-[var(--accent-bg)] text-[var(--accent)] hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Scanning…' : 'Re-scan'}
          </button>
        </div>

        {!loading && checks.length > 0 && (
          <div className="mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)]">
            <div className="flex items-center gap-4">
              <div className={`text-[32px] font-bold ${score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                {score}%
              </div>
              <div>
                <div className="text-[13px] font-medium text-[var(--fg)]">Security Score</div>
                <div className="text-[12px] text-[var(--fg-muted)]">
                  {checks.filter(c => c.severity === 'pass').length} of {checks.length} checks passed
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-[13px] text-[var(--fg-faint)]">Running security checks…</div>
        ) : (
          <div className="flex flex-col gap-3">
            {checks.map((check, i) => (
              <div key={i} className={`rounded-lg border p-4 ${severityBg(check.severity)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-bold uppercase ${severityColor(check.severity)}`}>
                    {severityLabel(check.severity)}
                  </span>
                  <span className="text-[13px] font-medium text-[var(--fg)]">{check.label}</span>
                </div>
                <p className="text-[12px] text-[var(--fg-muted)] mb-2">{check.description}</p>
                <ul className="flex flex-col gap-0.5">
                  {check.items.map((item, j) => (
                    <li key={j} className="text-[12px] text-[var(--fg)] font-mono pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--fg-subtle)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
