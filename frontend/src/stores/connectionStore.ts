import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConnectionType, ConnectionConfig, SavedConnection } from '../lib/connectionTypes'
import { isPostgresConfig } from '../lib/connectionTypes'

export type { SavedConnection } from '../lib/connectionTypes'

type ConnectionStatus = 'disconnected' | 'connected' | 'connecting' | 'error'

interface ConnectionState {
  connections: SavedConnection[]
  activeConnectionId: string | null
  activeConnectionUrl: string | null // kept for backward compat with postgres pages
  status: ConnectionStatus
  addConnection: (name: string, type: ConnectionType, config: ConnectionConfig) => SavedConnection
  updateConnection: (id: string, name: string, config: ConnectionConfig) => void
  deleteConnection: (id: string) => void
  setActiveConnection: (id: string | null) => void
  setStatus: (status: ConnectionStatus) => void
  getActiveConnection: () => SavedConnection | null
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      activeConnectionId: null,
      activeConnectionUrl: null,
      status: 'disconnected',

      addConnection: (name, type, config) => {
        const conn: SavedConnection = {
          id: crypto.randomUUID(),
          name,
          type,
          config,
          createdAt: Date.now(),
        }
        set((s) => ({ connections: [...s.connections, conn] }))
        return conn
      },

      updateConnection: (id, name, config) => {
        set((s) => {
          const connections = s.connections.map((c) =>
            c.id === id ? { ...c, name, config } : c
          )
          const isActive = s.activeConnectionId === id
          return {
            connections,
            ...(isActive
              ? { activeConnectionUrl: isPostgresConfig(config) ? config.url : null }
              : {}),
          }
        })
      },

      deleteConnection: (id) => {
        const s = get()
        set({
          connections: s.connections.filter((c) => c.id !== id),
          ...(s.activeConnectionId === id
            ? { activeConnectionId: null, activeConnectionUrl: null, status: 'disconnected' }
            : {}),
        })
      },

      setActiveConnection: (id) => {
        if (!id) {
          set({ activeConnectionId: null, activeConnectionUrl: null, status: 'disconnected' })
          return
        }
        const conn = get().connections.find((c) => c.id === id)
        if (!conn) return
        set({
          activeConnectionId: id,
          activeConnectionUrl: isPostgresConfig(conn.config) ? conn.config.url : null,
        })
      },

      setStatus: (status) => set({ status }),

      getActiveConnection: () => {
        const s = get()
        if (!s.activeConnectionId) return null
        return s.connections.find((c) => c.id === s.activeConnectionId) ?? null
      },
    }),
    {
      name: 'pgquery-connections',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0) {
          // Migrate from old format: { url: string } -> { type: 'postgres', config: { url } }
          const old = persisted as {
            connections?: Array<{ id: string; name: string; url?: string; type?: string; config?: ConnectionConfig; createdAt: number }>
            activeConnectionId?: string | null
            activeConnectionUrl?: string | null
            status?: string
          }
          const connections: SavedConnection[] = (old.connections ?? []).map((c) => {
            if (c.type && c.config) {
              return c as SavedConnection
            }
            return {
              id: c.id,
              name: c.name,
              type: 'postgres' as ConnectionType,
              config: { url: c.url ?? '' },
              createdAt: c.createdAt,
            }
          })
          return {
            ...old,
            connections,
          }
        }
        return persisted as ConnectionState
      },
    }
  )
)
