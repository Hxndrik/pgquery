import { useState, useEffect } from 'react'
import { getS3Stats, useS3Capabilities } from '../../../lib/s3Api'
import type { S3Stats } from '../../../lib/s3Api'
import type { S3Config } from '../../../lib/connectionTypes'
import { RefreshIcon } from '../../icons'
import { Button } from '../../ui/Button'
import { toast } from 'sonner'

interface S3BucketInfoProps {
  config: S3Config
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function S3BucketInfo({ config }: S3BucketInfoProps) {
  const [stats, setStats] = useState<S3Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const { readOnly, maxUploadBytes } = useS3Capabilities(config)

  const load = async () => {
    setLoading(true)
    try {
      // The server counts the whole bucket, not just the first page of a listing.
      setStats(await getS3Stats(config))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load bucket info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [config.bucket, config.endpoint])

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[var(--fg)]">Bucket Info</h2>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshIcon size={14} />
          <span className="ml-1">{loading ? 'Loading…' : 'Refresh'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoCard label="Bucket" value={config.bucket} />
        <InfoCard label="Region" value={config.region || '(default)'} />
        <InfoCard label="Endpoint" value={config.endpoint} />
        <InfoCard
          label="Objects"
          value={stats ? `${stats.objects.toLocaleString()}${stats.truncated ? '+' : ''}` : '—'}
          loading={loading}
        />
        <InfoCard
          label="Total Size"
          value={stats ? `${stats.truncated ? '≥ ' : ''}${formatSize(stats.bytes)}` : '—'}
          loading={loading}
        />
        <InfoCard label="Access" value={readOnly ? 'Read-only (demo bucket)' : 'Read and write'} />
        <InfoCard label="Max upload" value={maxUploadBytes ? formatSize(maxUploadBytes) : '—'} />
      </div>

      {stats?.truncated && (
        <p className="text-[12px] text-[var(--fg-muted)]">
          This bucket is large: counting stopped early, so the real totals are higher.
        </p>
      )}
    </div>
  )
}

function InfoCard({
  label,
  value,
  loading,
}: {
  label: string
  value: string
  loading?: boolean
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="text-[11px] font-medium text-[var(--fg-subtle)] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-[14px] text-[var(--fg)] font-mono break-all">
        {loading ? (
          <span className="text-[var(--fg-faint)]">Loading…</span>
        ) : (
          value
        )}
      </div>
    </div>
  )
}
