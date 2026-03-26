import { useState, useEffect, useCallback, useRef } from 'react'
import { listS3Objects, deleteS3Objects, uploadS3Object, getS3ObjectMeta } from '../../../lib/s3Api'
import type { S3Object, S3ObjectMeta } from '../../../lib/s3Api'
import type { S3Config } from '../../../lib/connectionTypes'
import { Button } from '../../ui/Button'
import { RefreshIcon, TrashIcon, SearchIcon, ChevronIcon, FolderIcon, FileIcon } from '../../icons'
import { toast } from 'sonner'
import { useResizableWidth } from '../../../hooks/useResizableWidth'
import { STORAGE_KEYS } from '../../../lib/storageKeys'
import FilePreview from './FilePreview'

interface S3ObjectBrowserProps {
  config: S3Config
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function S3ObjectBrowser({ config }: S3ObjectBrowserProps) {
  const [objects, setObjects] = useState<S3Object[]>([])
  const [prefix, setPrefix] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [previewMeta, setPreviewMeta] = useState<S3ObjectMeta | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { width: previewWidth, onMouseDown: onPreviewDragStart } = useResizableWidth({
    storageKey: STORAGE_KEYS.S3_PREVIEW_WIDTH,
    initialWidth: 480,
    minWidth: 300,
    maxWidth: 1200,
    direction: 'left',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listS3Objects(config, prefix || undefined, '/')
      const items: S3Object[] = [
        ...result.prefixes.map(p => ({ key: p, size: 0, lastModified: '', isFolder: true })),
        ...result.objects.filter(o => !o.isFolder),
      ]
      setObjects(items)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to list objects')
    } finally {
      setLoading(false)
    }
  }, [config, prefix])

  useEffect(() => { load() }, [load])

  const breadcrumbs = prefix ? prefix.split('/').filter(Boolean) : []

  const navigateToPrefix = (idx: number) => {
    if (idx < 0) {
      setPrefix('')
    } else {
      setPrefix(breadcrumbs.slice(0, idx + 1).join('/') + '/')
    }
    setSelected(new Set())
    setPreviewMeta(null)
  }

  const handleObjectClick = async (obj: S3Object) => {
    if (obj.isFolder) {
      setPrefix(obj.key)
      setSelected(new Set())
      setPreviewMeta(null)
      return
    }
    setMetaLoading(true)
    try {
      const meta = await getS3ObjectMeta(config, obj.key)
      setPreviewMeta(meta)
    } catch {
      toast.error('Failed to load object metadata')
    } finally {
      setMetaLoading(false)
    }
  }

  const handleSelect = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    const keys = Array.from(selected)
    try {
      const result = await deleteS3Objects(config, keys)
      toast.success(`Deleted ${result.deleted} object(s)`)
      setSelected(new Set())
      setPreviewMeta(null)
      load()
    } catch {
      toast.error('Failed to delete objects')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const key = prefix + file.name
      try {
        await uploadS3Object(config, file, key)
        toast.success(`Uploaded ${file.name}`)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    load()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const filtered = search
    ? objects.filter(o => {
        const name = o.key.slice(prefix.length)
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : objects

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Object list */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-[280px]">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-raised)] shrink-0">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshIcon size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            Upload
          </Button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
          {selected.size > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-[var(--error)]">
              <TrashIcon size={14} />
              <span className="ml-1">Delete ({selected.size})</span>
            </Button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg)] border border-[var(--border)]">
            <SearchIcon size={12} className="text-[var(--fg-subtle)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter..."
              className="bg-transparent text-[12px] text-[var(--fg)] outline-none w-32 placeholder:text-[var(--fg-faint)]"
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 px-4 py-1.5 text-[12px] border-b border-[var(--border)] bg-[var(--bg)] shrink-0">
          <button
            onClick={() => navigateToPrefix(-1)}
            className="text-[var(--accent)] hover:underline"
          >
            {config.bucket}
          </button>
          {breadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronIcon size={10} direction="right" className="text-[var(--fg-subtle)]" />
              <button
                onClick={() => navigateToPrefix(i)}
                className={i === breadcrumbs.length - 1
                  ? 'text-[var(--fg)]'
                  : 'text-[var(--accent)] hover:underline'
                }
              >
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* Object table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[13px] text-[var(--fg-faint)]">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[13px] text-[var(--fg-faint)]">
              {search ? 'No matching objects' : 'Empty'}
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--fg-subtle)] text-left">
                  <th className="w-8 px-4 py-2" />
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium w-24 text-right">Size</th>
                  <th className="px-2 py-2 font-medium w-44 text-right">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((obj) => {
                  const name = obj.key.slice(prefix.length)
                  const isSelected = selected.has(obj.key)
                  const isActive = previewMeta?.key === obj.key
                  return (
                    <tr
                      key={obj.key}
                      onClick={() => handleObjectClick(obj)}
                      className={`border-b border-[var(--border)] cursor-pointer transition-colors ${
                        isActive ? 'bg-[var(--bg-active)]' :
                        isSelected ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <td className="px-4 py-1.5">
                        {!obj.isFolder && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => handleSelect(obj.key, e)}
                            onChange={() => {}}
                            className="accent-[var(--accent)]"
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-[var(--fg)]">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[var(--fg-subtle)] shrink-0">
                            {obj.isFolder
                              ? <FolderIcon size={14} />
                              : <FileIcon size={14} />
                            }
                          </span>
                          {name}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right text-[var(--fg-muted)]">
                        {obj.isFolder ? '--' : formatSize(obj.size)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-[var(--fg-muted)]">
                        {obj.lastModified ? formatDate(obj.lastModified) : '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border)] bg-[var(--bg-raised)] text-[11px] text-[var(--fg-subtle)] shrink-0">
          <span>{filtered.length} object(s)</span>
          <span>
            {formatSize(filtered.reduce((sum, o) => sum + (o.isFolder ? 0 : o.size), 0))} total
          </span>
        </div>
      </div>

      {/* Preview panel */}
      {(metaLoading || previewMeta) && (
        <div
          style={{ width: previewWidth }}
          className="shrink-0 border-l border-[var(--border)] bg-[var(--bg-raised)] flex flex-col overflow-hidden relative"
        >
          <div
            onMouseDown={onPreviewDragStart}
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-[var(--accent)] transition-colors z-10"
          />
          {metaLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-[12px] text-[var(--fg-faint)]">Loading...</div>
            </div>
          ) : previewMeta ? (
            <FilePreview
              key={previewMeta.key}
              config={config}
              meta={previewMeta}
              onClose={() => setPreviewMeta(null)}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
