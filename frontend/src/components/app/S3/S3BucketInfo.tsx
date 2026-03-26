import { useState, useEffect } from 'react'
import { listS3Objects } from '../../../lib/s3Api'
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
  const [objectCount, setObjectCount] = useState<number | null>(null)
  const [totalSize, setTotalSize] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      // List all objects (no delimiter) to get full picture
      const result = await listS3Objects(config)
      setObjectCount(result.objects.length)
      setTotalSize(result.objects.reduce((sum, o) => sum + o.size, 0))
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
          value={objectCount !== null ? String(objectCount) : '—'}
          loading={loading}
        />
        <InfoCard
          label="Total Size"
          value={totalSize !== null ? formatSize(totalSize) : '—'}
          loading={loading}
        />
      </div>
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
