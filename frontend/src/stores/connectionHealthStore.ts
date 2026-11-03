import { create } from 'zustand'

// Facts learned from the last successful test of each connection. Not
// persisted: they are re-checked whenever a connection is opened.
interface ConnectionHealthState {
  /** connection URL → whether the server connection uses TLS */
  encrypted: Record<string, boolean>
  setEncrypted: (url: string, encrypted: boolean) => void
}

export const useConnectionHealth = create<ConnectionHealthState>()((set) => ({
  encrypted: {},
  setEncrypted: (url, encrypted) => set((s) => ({ encrypted: { ...s.encrypted, [url]: encrypted } })),
}))
