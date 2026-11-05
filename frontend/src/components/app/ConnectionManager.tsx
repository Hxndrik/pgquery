import { useState, useCallback, Suspense } from 'react'
import { Modal } from '../ui/Modal'
import { TrashIcon } from '../icons'
import { useConnectionStore } from '../../stores/connectionStore'
import { toast } from 'sonner'
import { getConnectionType, getRegisteredTypes } from '../../lib/connectionRegistry'
import type { ConnectionType, ConnectionConfig } from '../../lib/connectionTypes'

interface ConnectionManagerProps {
  open: boolean
  onClose: () => void
  editingId?: string | null
  /** Called with the type of a newly added connection once it has connected. */
  onConnected?: (type: ConnectionType) => void
}

export function ConnectionManager({ open, onClose, editingId, onConnected }: ConnectionManagerProps) {
  const { connections, addConnection, updateConnection, deleteConnection, setActiveConnection, setStatus } =
    useConnectionStore()
  const registeredTypes = getRegisteredTypes()

  const editingConnection = editingId ? connections.find((c) => c.id === editingId) : null
  const [selectedType, setSelectedType] = useState<ConnectionType>(
    editingConnection?.type ?? 'postgres'
  )

  // When editingId changes, sync the type
  const effectiveType = editingConnection?.type ?? selectedType
  const descriptor = getConnectionType(effectiveType)

  const handleConnect = useCallback(
    async (config: ConnectionConfig, name: string) => {
      if (!descriptor) return

      if (editingId) {
        updateConnection(editingId, name, config)
        const isActive = useConnectionStore.getState().activeConnectionId === editingId
        // Only attempt to re-test when editing the currently active connection.
        // For non-active ones, just save so users can edit unavailable connections.
        if (!isActive) {
          toast.success(`Saved ${name}`)
          onClose()
          return
        }
        setStatus('connecting')
        const result = await descriptor.testConnection(config)
        if (result.ok) {
          setActiveConnection(editingId)
          setStatus('connected')
          toast.success(`Updated and connected to ${name}`)
        } else {
          setStatus('error')
          toast.error(`Saved, but connection failed: ${result.error ?? 'unknown error'}`)
        }
        onClose()
      } else {
        const conn = addConnection(name, effectiveType, config)
        setStatus('connecting')
        const result = await descriptor.testConnection(config)
        if (result.ok) {
          setActiveConnection(conn.id)
          setStatus('connected')
          toast.success(`Connected to ${name}`)
          onConnected?.(effectiveType)
          onClose()
        } else {
          setStatus('error')
          toast.error(result.error ?? 'Connection failed')
        }
      }
    },
    [editingId, effectiveType, descriptor, addConnection, updateConnection, setActiveConnection, setStatus, onClose, onConnected]
  )

  const FormComponent = descriptor?.formComponent

  return (
    <Modal open={open} onClose={onClose} title={editingId ? 'Edit connection' : 'New connection'} width="max-w-xl">
      <div className="flex flex-col gap-4">
        {/* Type selector -- only when creating new */}
        {!editingId && registeredTypes.length > 1 && (
          <div>
            <label className="label block mb-1.5">Connection type</label>
            <div className="flex border border-[var(--border-mid)] rounded-sm" role="tablist">
              {registeredTypes.map((desc) => {
                const Icon = desc.icon
                return (
                  <button
                    key={desc.type}
                    onClick={() => setSelectedType(desc.type)}
                    role="tab"
                    aria-selected={effectiveType === desc.type}
                    className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 px-2 text-[12px] font-semibold transition-colors ${
                      effectiveType === desc.type
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                        : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <Icon size={14} />
                    {desc.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Type-specific form */}
        {FormComponent && (
          <Suspense fallback={<div className="py-4 text-center text-[12px] text-[var(--fg-faint)]">Loading…</div>}>
            <FormComponent
              key={editingId ?? effectiveType}
              onConnect={handleConnect}
              initial={editingConnection ? { config: editingConnection.config, name: editingConnection.name } : undefined}
              isEdit={!!editingId}
            />
          </Suspense>
        )}

        {editingId && (
          <div className="pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => { deleteConnection(editingId); onClose(); }}
              className="flex items-center gap-1.5 text-[13px] text-[var(--fg-subtle)] hover:text-[var(--error)] transition-colors"
            >
              <TrashIcon size={14} />
              Delete connection
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
