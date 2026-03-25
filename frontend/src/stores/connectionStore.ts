import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SavedConnection {
  id: string
  name: string
  url: string
  createdAt: number
}

type ConnectionStatus = 'disconnected' | 'connected' | 'connecting' | 'error'

interface ConnectionState {
  connections: SavedConnection[]
  activeConnectionId: string | null
  activeConnectionUrl: string | null
  status: ConnectionStatus
  addConnection: (name: string, url: string) => SavedConnection
  updateConnection: (id: string, name: string, url: string) => void
  deleteConnection: (id: string) => void
  setActiveConnection: (id: string | null, url?: string) => void
  setStatus: (status: ConnectionStatus) => void
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      activeConnectionId: null,
      activeConnectionUrl: null,
      status: 'disconnected',
      addConnection: (name, url) => {
        const conn: SavedConnection = {
          id: crypto.randomUUID(),
          name,
          url,
          createdAt: Date.now(),
        }
        set((s) => ({ connections: [...s.connections, conn] }))
        return conn
      },
      updateConnection: (id, name, url) => {
        set((s) => ({
          connections: s.connections.map((c) =>
            c.id === id ? { ...c, name, url } : c
          ),
          ...(s.activeConnectionId === id ? { activeConnectionUrl: url } : {}),
        }))
      },
      deleteConnection: (id) => {
        const s = get()
        set({
          connections: s.connections.filter((c) => c.id !== id),
          ...(s.activeConnectionId === id ? { activeConnectionId: null, activeConnectionUrl: null, status: 'disconnected' } : {}),
        })
      },
      setActiveConnection: (id, url) => {
        if (!id) {
          set({ activeConnectionId: null, activeConnectionUrl: null, status: 'disconnected' })
          return
        }
        const conn = get().connections.find((c) => c.id === id)
        set({
          activeConnectionId: id,
          activeConnectionUrl: url ?? conn?.url ?? null,
        })
      },
      setStatus: (status) => set({ status }),
    }),
    { name: 'pgquery-connections' }
  )
)
