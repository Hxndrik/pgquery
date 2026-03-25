import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ColumnInfo {
  name: string
  type: string
}

export interface QueryResult {
  columns: ColumnInfo[]
  rows: unknown[][]
  rowCount: number
  duration: number
  truncated?: boolean
}

export interface QueryError {
  error: string
  code?: string
  position?: number
}

export interface Tab {
  id: string
  name: string
  sql: string
  result: QueryResult | null
  error: QueryError | null
  isLoading: boolean
}

interface TabState {
  tabs: Tab[]
  activeTabId: string
  addTab: () => string
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateSql: (id: string, sql: string) => void
  setLoading: (id: string, loading: boolean) => void
  setResult: (id: string, result: QueryResult) => void
  setError: (id: string, error: QueryError) => void
  clearResult: (id: string) => void
  renameTab: (id: string, name: string) => void
}

function newTab(n: number): Tab {
  return {
    id: crypto.randomUUID(),
    name: `Query ${n}`,
    sql: '',
    result: null,
    error: null,
    isLoading: false,
  }
}

const initialTab = newTab(1)

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [initialTab],
      activeTabId: initialTab.id,
      addTab: () => {
        const n = get().tabs.length + 1
        const tab = newTab(n)
        set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }))
        return tab.id
      },
      closeTab: (id) => {
        const s = get()
        if (s.tabs.length === 1) {
          const fresh = newTab(1)
          set({ tabs: [fresh], activeTabId: fresh.id })
          return
        }
        const idx = s.tabs.findIndex((t) => t.id === id)
        const newTabs = s.tabs.filter((t) => t.id !== id)
        const nextActive =
          s.activeTabId === id
            ? (newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? newTabs[0].id)
            : s.activeTabId
        set({ tabs: newTabs, activeTabId: nextActive })
      },
      setActiveTab: (id) => set({ activeTabId: id }),
      updateSql: (id, sql) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, sql } : t)) })),
      setLoading: (id, loading) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, isLoading: loading, error: null } : t)) })),
      setResult: (id, result) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, result, error: null, isLoading: false } : t)) })),
      setError: (id, error) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, error, result: null, isLoading: false } : t)) })),
      clearResult: (id) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, result: null, error: null } : t)) })),
      renameTab: (id, name) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, name } : t)) })),
    }),
    { name: 'pgquery-tabs' }
  )
)
