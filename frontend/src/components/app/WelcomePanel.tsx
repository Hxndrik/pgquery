import { useState } from 'react'
import { toast } from 'sonner'
import { Tuple } from '../../brand/Pixel'
import { Button } from '../ui/Button'
import { connectDemo, connectDemoBucket } from '../../lib/demo'

/** Shown when nothing is connected: the demos and how to add your own. */
export function WelcomePanel({ onConnected }: { onConnected: (view: string) => void }) {
  const [busy, setBusy] = useState<'db' | 's3' | null>(null)

  const openDemo = async (kind: 'db' | 's3') => {
    setBusy(kind)
    const error = await (kind === 'db' ? connectDemo() : connectDemoBucket())
    setBusy(null)
    if (error) toast.error(error)
    else onConnected(kind === 'db' ? 'queries' : 's3-browser')
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[640px] mx-auto px-6 py-16 flex flex-col gap-8">
        <figure className="flex flex-col gap-3">
          <div className="border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-raised)] py-10 flex justify-center">
            <Tuple style="dither" width={210} title="Tuple, the pgquery elephant" />
          </div>
          <figcaption className="font-mono text-[12px] text-[var(--fg-subtle)]">
            <strong className="text-[var(--fg)]">FIG. 1</strong> Nothing connected yet.
          </figcaption>
        </figure>

        <div className="flex flex-col gap-3">
          <h1 className="text-[34px] leading-[0.95] font-black uppercase tracking-[-0.02em] [font-stretch:125%] text-balance">
            Connect a database
          </h1>
          <p className="text-[15px] text-[var(--fg-muted)] max-w-[34em]">
            Open a sample to look around, or add your own connection with the{' '}
            <strong className="text-[var(--fg)]">+</strong> next to Connections. Paste a{' '}
            <code className="font-mono text-[13px]">postgres://</code> URI or a key=value string, or pick S3 for a bucket.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => openDemo('db')} disabled={busy !== null}>
              {busy === 'db' ? 'Connecting…' : 'Open the demo database →'}
            </Button>
            <span className="font-mono text-[12px] text-[var(--fg-subtle)]">read-only · 10 tables · 120k rows</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" variant="outline" onClick={() => openDemo('s3')} disabled={busy !== null}>
              {busy === 's3' ? 'Connecting…' : 'Open the demo bucket →'}
            </Button>
            <span className="font-mono text-[12px] text-[var(--fg-subtle)]">read-only · images, video, CSV, JSON</span>
          </div>
        </div>

        <div className="border-t-[1.5px] border-[var(--border-strong)] pt-4 grid gap-1 font-mono text-[12px] text-[var(--fg-muted)]">
          <span className="label mb-1">Where your data goes</span>
          <span>Connections are saved in this browser (localStorage), S3 keys included.</span>
          <span>The proxy forwards queries and keeps nothing.</span>
          <span>Schema changes (CREATE, ALTER, GRANT) are shown as SQL before they run.</span>
        </div>
      </div>
    </div>
  )
}
