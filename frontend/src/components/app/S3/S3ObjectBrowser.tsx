import { useState, useEffect, useCallback, useRef } from 'react'
import {
  listS3Objects,
  deleteS3Objects,
  uploadS3Object,
  createS3Folder,
  getS3ObjectMeta,
  getS3Stats,
  useS3Capabilities,
} from '../../../lib/s3Api'
import type { S3Object, S3ObjectMeta } from '../../../lib/s3Api'
import type { S3Config } from '../../../lib/connectionTypes'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { Input } from '../../ui/Input'
import { Modal } from '../../ui/Modal'
import { RefreshIcon, TrashIcon, SearchIcon, ChevronIcon, FolderIcon, FileIcon, PlusIcon } from '../../icons'
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

const errorMessage = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

/** A delete waiting for the user's confirmation, with the number of objects it removes. */
interface PendingDelete {
  keys: string[]
  prefixes: string[]
  objects: number | null // null while counting
  truncated: boolean
}

export default function S3ObjectBrowser({ config }: S3ObjectBrowserProps) {
  const { readOnly, maxUploadBytes } = useS3Capabilities(config)
  const [objects, setObjects] = useState<S3Object[]>([])
  const [nextToken, setNextToken] = useState<string | undefined>()
  const [prefix, setPrefix] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [previewMeta, setPreviewMeta] = useState<S3ObjectMeta | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const latestLoad = useRef(0)
  const { width: previewWidth, onMouseDown: onPreviewDragStart } = useResizableWidth({
    storageKey: STORAGE_KEYS.S3_PREVIEW_WIDTH,
    initialWidth: 480,
    minWidth: 300,
    maxWidth: 1200,
    direction: 'left',
  })

  const toItems = (result: Awaited<ReturnType<typeof listS3Objects>>): S3Object[] => [
    ...result.prefixes.map((p) => ({ key: p, size: 0, lastModified: '', isFolder: true })),
    ...result.objects.filter((o) => !o.isFolder),
  ]

  const load = useCallback(async () => {
    const id = ++latestLoad.current
    setLoading(true)
    try {
      const result = await listS3Objects(config, prefix || undefined, '/')
      if (id !== latestLoad.current) return // a newer folder was opened meanwhile
      setObjects(toItems(result))
      setNextToken(result.nextToken)
    } catch (e) {
      if (id === latestLoad.current) toast.error(errorMessage(e, 'Failed to list objects'))
    } finally {
      if (id === latestLoad.current) setLoading(false)
    }
  }, [config, prefix])

  useEffect(() => { load() }, [load])

  const loadMore = async () => {
    if (!nextToken) return
    const id = latestLoad.current
    setLoadingMore(true)
    try {
      const result = await listS3Objects(config, prefix || undefined, '/', nextToken)
      if (id !== latestLoad.current) return
      // Folders can repeat across pages; keep each key once.
      setObjects((prev) => {
        const seen = new Set(prev.map((o) => o.key))
        return [...prev, ...toItems(result).filter((o) => !seen.has(o.key))]
      })
      setNextToken(result.nextToken)
    } catch (e) {
      toast.error(errorMessage(e, 'Failed to load more objects'))
    } finally {
      setLoadingMore(false)
    }
  }

  const breadcrumbs = prefix ? prefix.split('/').filter(Boolean) : []

  const openPrefix = (next: string) => {
    setPrefix(next)
    setSelected(new Set())
    setPreviewMeta(null)
  }

  const navigateToPrefix = (idx: number) => {
    openPrefix(idx < 0 ? '' : breadcrumbs.slice(0, idx + 1).join('/') + '/')
  }

  const handleObjectClick = async (obj: S3Object) => {
    if (obj.isFolder) {
      openPrefix(obj.key)
      return
    }
    setMetaLoading(true)
    try {
      setPreviewMeta(await getS3ObjectMeta(config, obj.key))
    } catch (e) {
      toast.error(errorMessage(e, 'Failed to load object metadata'))
    } finally {
      setMetaLoading(false)
    }
  }

  const handleSelect = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Deleting shows what will go first: files count as one each, folders as
  // everything under them (counted by the server).
  const askDelete = async () => {
    const all = Array.from(selected)
    const prefixes = all.filter((k) => k.endsWith('/'))
    const keys = all.filter((k) => !k.endsWith('/'))
    setPendingDelete({ keys, prefixes, objects: prefixes.length ? null : keys.length, truncated: false })
    if (prefixes.length === 0) return
    try {
      const counts = await Promise.all(prefixes.map((p) => getS3Stats(config, p)))
      setPendingDelete((cur) => cur && {
        ...cur,
        objects: keys.length + counts.reduce((sum, c) => sum + c.objects, 0),
        truncated: counts.some((c) => c.truncated),
      })
    } catch (e) {
      setPendingDelete(null)
      toast.error(errorMessage(e, 'Failed to count the objects'))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const result = await deleteS3Objects(config, { keys: pendingDelete.keys, prefixes: pendingDelete.prefixes })
      if (result.failed.length > 0) {
        toast.error(`Deleted ${result.deleted}, but ${result.failed.length} failed: ${result.failed[0].error}`)
      } else {
        toast.success(`Deleted ${result.deleted} object${result.deleted === 1 ? '' : 's'}`)
      }
      setPendingDelete(null)
      setSelected(new Set())
      setPreviewMeta(null)
      load()
    } catch (e) {
      toast.error(errorMessage(e, 'Failed to delete'))
    } finally {
      setDeleting(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    const uploaded: string[] = []
    for (const file of files) {
      if (maxUploadBytes && file.size > maxUploadBytes) {
        toast.error(`${file.name} is larger than the ${formatSize(maxUploadBytes)} upload limit`)
        continue
      }
      try {
        await uploadS3Object(config, file, prefix + file.name)
        uploaded.push(file.name)
      } catch (err) {
        toast.error(`${file.name}: ${errorMessage(err, 'upload failed')}`)
      }
    }
    if (uploaded.length > 0) toast.success(uploaded.length === 1 ? `Uploaded ${uploaded[0]}` : `Uploaded ${uploaded.length} files`)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    load()
  }

  const folderNameError = folderName.includes('/')
    ? 'A folder name can’t contain /'
    : Array.from(folderName).some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f)
      ? 'A folder name can’t contain control characters'
      : null
  const canCreateFolder = folderName.trim() !== '' && !folderNameError

  const handleCreateFolder = async () => {
    if (!canCreateFolder) return
    try {
      await createS3Folder(config, `${prefix}${folderName.trim()}/`)
      setFolderOpen(false)
      setFolderName('')
      load()
    } catch (e) {
      toast.error(errorMessage(e, 'Failed to create the folder'))
    }
  }

  const filtered = search
    ? objects.filter((o) => o.key.slice(prefix.length).toLowerCase().includes(search.toLowerCase()))
    : objects

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Object list */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-[280px]">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-raised)] shrink-0">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} aria-label="Refresh">
            <RefreshIcon size={14} />
          </Button>
          {readOnly ? (
            <Badge variant="neutral">Read-only</Badge>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
              <Button variant="ghost" size="sm" onClick={() => setFolderOpen(true)}>
                <PlusIcon size={12} />
                <span className="ml-1">New folder</span>
              </Button>
              {selected.size > 0 && (
                <Button variant="ghost" size="sm" onClick={askDelete} className="text-[var(--error)]">
                  <TrashIcon size={14} />
                  <span className="ml-1">Delete ({selected.size})</span>
                </Button>
              )}
            </>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg)] border border-[var(--border)]">
            <SearchIcon size={12} className="text-[var(--fg-subtle)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter..."
              aria-label="Filter this folder"
              className="bg-transparent text-[12px] text-[var(--fg)] outline-none w-32 placeholder:text-[var(--fg-faint)]"
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 px-4 py-1.5 text-[12px] border-b border-[var(--border)] bg-[var(--bg)] shrink-0">
          <button
            onClick={() => navigateToPrefix(-1)}
            className="text-[var(--accent-text)] hover:underline"
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
                  : 'text-[var(--accent-text)] hover:underline'
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
                        {!readOnly && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => handleSelect(obj.key, e)}
                            onChange={() => {}}
                            aria-label={`Select ${name}`}
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
        <div className="flex items-center justify-between gap-3 px-4 py-1.5 border-t border-[var(--border)] bg-[var(--bg-raised)] text-[11px] text-[var(--fg-subtle)] shrink-0">
          <span>
            {filtered.length}{nextToken ? '+' : ''} item(s)
            {nextToken && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="ml-3 text-[var(--accent-text)] hover:underline disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </span>
          <span>
            {formatSize(filtered.reduce((sum, o) => sum + (o.isFolder ? 0 : o.size), 0))}{nextToken ? ' so far' : ' total'}
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

      {/* New folder */}
      <Modal open={folderOpen} onClose={() => setFolderOpen(false)} title="New folder" width="max-w-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleCreateFolder()
          }}
        >
          <Input
            label="Folder name"
            placeholder="photos"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
          />
          <p className="text-[12px] text-[var(--fg-muted)]">
            {folderNameError ?? (
              <>Creates <code className="font-mono">{prefix}{folderName.trim() || 'name'}/</code>, an empty marker object like the one the AWS console makes. S3 shows a folder once it holds objects.</>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFolderOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!canCreateFolder}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={pendingDelete !== null} onClose={() => !deleting && setPendingDelete(null)} title="Delete from bucket" width="max-w-sm">
        {pendingDelete && (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-[var(--fg)]">
              {pendingDelete.objects === null
                ? 'Counting what is in the selected folders…'
                : <>This permanently deletes <strong>{pendingDelete.objects.toLocaleString()}{pendingDelete.truncated ? '+' : ''} object{pendingDelete.objects === 1 ? '' : 's'}</strong>
                  {pendingDelete.prefixes.length > 0 && <> from {pendingDelete.prefixes.length} folder{pendingDelete.prefixes.length === 1 ? '' : 's'} and everything below</>}
                  . It can’t be undone unless the bucket keeps versions.</>}
            </p>
            <ul className="text-[12px] font-mono text-[var(--fg-muted)] max-h-28 overflow-auto">
              {[...pendingDelete.prefixes, ...pendingDelete.keys].slice(0, 8).map((k) => (
                <li key={k} className="truncate">{k}</li>
              ))}
              {pendingDelete.prefixes.length + pendingDelete.keys.length > 8 && (
                <li>…and {pendingDelete.prefixes.length + pendingDelete.keys.length - 8} more</li>
              )}
            </ul>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)} disabled={deleting}>Cancel</Button>
              <Button variant="outline" size="sm" onClick={confirmDelete} disabled={deleting || pendingDelete.objects === null}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
