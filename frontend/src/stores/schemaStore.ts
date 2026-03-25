import { create } from 'zustand'
import { fetchSchema, type SchemaResponse } from '../lib/api'

interface SchemaState {
  schema: SchemaResponse | null
  isLoading: boolean
  loadSchema: (connectionUrl: string) => Promise<void>
  clearSchema: () => void
}

export const useSchemaStore = create<SchemaState>((set) => ({
  schema: null,
  isLoading: false,
  loadSchema: async (connectionUrl: string) => {
    set({ isLoading: true })
    const schema = await fetchSchema(connectionUrl)
    set({ schema, isLoading: false })
  },
  clearSchema: () => set({ schema: null, isLoading: false }),
}))
