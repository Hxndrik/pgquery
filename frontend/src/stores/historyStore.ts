import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface HistoryEntry {
  id: string
  query: string
  timestamp: number
  duration: number
  rowCount: number
  connectionName: string
}

interface HistoryState {
  entries: HistoryEntry[]
  push: (entry: Omit<HistoryEntry, 'id'>) => void
  clear: () => void
}

const MAX_HISTORY = 500

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      push: (entry) =>
        set((s) => ({
          entries: [
            { ...entry, id: crypto.randomUUID() },
            ...s.entries,
          ].slice(0, MAX_HISTORY),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'pgquery-history' }
  )
)
