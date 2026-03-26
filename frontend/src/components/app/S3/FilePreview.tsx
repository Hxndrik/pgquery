import { useState, useEffect, useCallback } from 'react'
import type { S3ObjectMeta } from '../../../lib/s3Api'
import { downloadS3ObjectUrl } from '../../../lib/s3Api'
import type { S3Config } from '../../../lib/connectionTypes'
import { CloseIcon, DownloadIcon } from '../../icons'
import { Button } from '../../ui/Button'
import { getFileCategory, getAutoPreviewLimit, getManualPreviewLimit, canPreview } from './fileTypes'
import type { FileCategory } from './fileTypes'

interface FilePreviewProps {
  config: S3Config
  meta: S3ObjectMeta
  onClose: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(iso: string): string {
  if (!iso) return '--'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="text-[var(--fg-subtle)] text-[11px] w-24 shrink-0">{label}</span>
      <span className="text-[var(--fg)] text-[12px] font-mono break-all">{value}</span>
    </div>
  )
}

function TextPreview({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => { if (!cancelled) setContent(text) })
      .catch(e => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [url])

  if (error) {
    return <div className="p-3 text-[12px] text-[var(--error)]">Failed to load: {error}</div>
  }
  if (content === null) {
    return <div className="p-3 text-[12px] text-[var(--fg-faint)]">Loading content...</div>
  }

  const lines = content.split('\n')
  const gutterWidth = String(lines.length).length

  return (
    <div className="flex-1 overflow-auto bg-[var(--bg)] font-mono text-[11px] leading-[1.6]">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-[var(--bg-hover)]">
              <td className="px-2 text-right text-[var(--fg-faint)] select-none border-r border-[var(--border)] sticky left-0 bg-[var(--bg-raised)]"
                  style={{ minWidth: `${gutterWidth + 2}ch` }}>
                {i + 1}
              </td>
              <td className="px-3 text-[var(--fg)] whitespace-pre">{line || ' '}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ImagePreview({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[var(--bg)]">
      {!loaded && !error && (
        <div className="text-[12px] text-[var(--fg-faint)]">Loading image...</div>
      )}
      {error && (
        <div className="text-[12px] text-[var(--error)]">Failed to load image</div>
      )}
      <img
        src={url}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`max-w-full max-h-full object-contain ${loaded ? '' : 'hidden'}`}
        alt=""
      />
    </div>
  )
}

function VideoPreview({ url }: { url: string }) {
  return (
    <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[var(--bg)]">
      <video controls src={url} className="max-w-full max-h-full">
        Your browser does not support video playback.
      </video>
    </div>
  )
}

function AudioPreview({ url }: { url: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg)]">
      <audio controls src={url} className="w-full max-w-md">
        Your browser does not support audio playback.
      </audio>
    </div>
  )
}

function PdfPreview({ url }: { url: string }) {
  return (
    <div className="flex-1 overflow-hidden bg-[var(--bg)]">
      <iframe src={url} className="w-full h-full border-0" title="PDF preview" />
    </div>
  )
}

function NoPreview({ category }: { category: FileCategory }) {
  const label = category === 'font' ? 'Font files' :
                category === 'archive' ? 'Archive files' :
                'This file type'
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="text-[13px] text-[var(--fg-faint)]">{label} cannot be previewed</div>
    </div>
  )
}

function PreviewContent({
  category,
  meta,
  downloadUrl,
  inlineUrl,
}: {
  category: FileCategory
  meta: S3ObjectMeta
  downloadUrl: string
  inlineUrl: string
}) {
  const [manualLoad, setManualLoad] = useState(false)

  const autoLimit = getAutoPreviewLimit(category)
  const manualLimit = getManualPreviewLimit(category)

  if (!canPreview(category)) {
    return <NoPreview category={category} />
  }

  const size = meta.size
  const withinAuto = size <= autoLimit
  const withinManual = size <= manualLimit
  const shouldShow = withinAuto || manualLoad

  if (!withinManual) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="text-center">
          <div className="text-[13px] text-[var(--fg-faint)]">File too large to preview</div>
          <div className="text-[11px] text-[var(--fg-faint)] mt-1">{formatSize(size)}</div>
        </div>
      </div>
    )
  }

  if (!shouldShow) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="text-center">
          <div className="text-[12px] text-[var(--fg-faint)] mb-2">{formatSize(size)} -- preview not loaded automatically</div>
          <Button variant="ghost" size="sm" onClick={() => setManualLoad(true)}>
            Load preview
          </Button>
        </div>
      </div>
    )
  }

  switch (category) {
    case 'image':
      return <ImagePreview url={downloadUrl} />
    case 'video':
      return <VideoPreview url={downloadUrl} />
    case 'audio':
      return <AudioPreview url={downloadUrl} />
    case 'pdf':
      return <PdfPreview url={inlineUrl} />
    case 'text':
      return <TextPreview url={downloadUrl} />
    case 'unknown':
      return <TextPreview url={downloadUrl} />
    default:
      return <NoPreview category={category} />
  }
}

export default function FilePreview({ config, meta, onClose }: FilePreviewProps) {
  const category = getFileCategory(meta.key)
  const filename = meta.key.split('/').pop() ?? meta.key
  const downloadUrl = downloadS3ObjectUrl(config, meta.key)
  const inlineUrl = downloadUrl + '&inline=1'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-[var(--fg)] truncate">{filename}</div>
          <div className="flex items-center gap-3 text-[10px] text-[var(--fg-subtle)] mt-0.5">
            <span>{formatSize(meta.size)}</span>
            <span>{meta.contentType || 'unknown type'}</span>
            <span>{formatDate(meta.lastModified)}</span>
          </div>
        </div>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <DownloadIcon size={13} />
          </Button>
        </a>
        <button onClick={onClose} className="p-1 text-[var(--fg-subtle)] hover:text-[var(--fg)] rounded hover:bg-[var(--bg-hover)]">
          <CloseIcon size={12} />
        </button>
      </div>

      {/* Metadata */}
      <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
        <MetaRow label="Key" value={meta.key} />
        {Object.entries(meta.metadata).map(([k, v]) => (
          <MetaRow key={k} label={k} value={v} />
        ))}
      </div>

      {/* Preview */}
      <PreviewContent
        category={category}
        meta={meta}
        downloadUrl={downloadUrl}
        inlineUrl={inlineUrl}
      />
    </div>
  )
}
