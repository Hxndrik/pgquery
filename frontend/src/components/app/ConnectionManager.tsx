import { useState, useCallback, Suspense } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TrashIcon } from '../icons'
import { useConnectionStore } from '../../stores/connectionStore'
import { toast } from 'sonner'
import { getConnectionType, getRegisteredTypes } from '../../lib/connectionRegistry'
import type { ConnectionType, ConnectionConfig } from '../../lib/connectionTypes'

interface ConnectionManagerProps {
  open: boolean
  onClose: () => void
  editingId?: string | null
}

export function ConnectionManager({ open, onClose, editingId }: ConnectionManagerProps) {
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
        setStatus('connecting')
        const result = await descriptor.testConnection(config)
        if (result.ok) {
          setActiveConnection(editingId)
          setStatus('connected')
          toast.success(`Updated and connected to ${name}`)
          onClose()
        } else {
          setStatus('error')
          toast.error(result.error ?? 'Connection failed')
        }
      } else {
        const conn = addConnection(name, effectiveType, config)
        setStatus('connecting')
        const result = await descriptor.testConnection(config)
        if (result.ok) {
          setActiveConnection(conn.id)
          setStatus('connected')
          toast.success(`Connected to ${name}`)
          onClose()
        } else {
          setStatus('error')
          toast.error(result.error ?? 'Connection failed')
        }
      }
    },
    [editingId, effectiveType, descriptor, addConnection, updateConnection, setActiveConnection, setStatus, onClose]
  )

  const FormComponent = descriptor?.formComponent

  return (
    <Modal open={open} onClose={onClose} title={editingId ? 'Edit connection' : 'New connection'} width="max-w-xl">
      <div className="flex flex-col gap-4">
        {/* Type selector -- only when creating new */}
        {!editingId && registeredTypes.length > 1 && (
          <div>
            <label className="block text-[12px] font-medium text-[var(--fg-muted)] mb-1.5">
              Connection type
            </label>
            <div className="flex gap-1 p-1 bg-[var(--bg-hover)] rounded">
              {registeredTypes.map((desc) => {
                const Icon = desc.icon
                return (
                  <button
                    key={desc.type}
                    onClick={() => setSelectedType(desc.type)}
                    className={`flex items-center gap-1.5 flex-1 py-1.5 px-2 text-[12px] font-medium rounded transition-colors ${
                      effectiveType === desc.type
                        ? 'bg-[var(--bg-card)] text-[var(--fg)] shadow-sm'
                        : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
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
