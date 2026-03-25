import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SavedQuery {
  id: string
  name: string
  query: string
  createdAt: number
  updatedAt: number
}

interface SavedState {
  queries: SavedQuery[]
  save: (name: string, query: string) => void
  update: (id: string, name: string, query: string) => void
  delete: (id: string) => void
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set) => ({
      queries: [],
      save: (name, query) =>
        set((s) => ({
          queries: [
            {
              id: crypto.randomUUID(),
              name,
              query,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...s.queries,
          ],
        })),
      update: (id, name, query) =>
        set((s) => ({
          queries: s.queries.map((q) =>
            q.id === id ? { ...q, name, query, updatedAt: Date.now() } : q
          ),
        })),
      delete: (id) =>
        set((s) => ({ queries: s.queries.filter((q) => q.id !== id) })),
    }),
    { name: 'pgquery-saved' }
  )
)
