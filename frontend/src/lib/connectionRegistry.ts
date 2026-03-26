import type { ComponentType, LazyExoticComponent } from 'react'
import type { ConnectionType, ConnectionConfig } from './connectionTypes'

export interface NavSection {
  label: string
  storageKey: string
  items: { view: string; icon: React.ReactNode; label: string }[]
}

export interface ConnectionFormProps {
  onConnect: (config: ConnectionConfig, name: string) => void
  initial?: { config: ConnectionConfig; name: string }
  isEdit?: boolean
}

export interface ConnectionTypeDescriptor {
  type: ConnectionType
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  formComponent: ComponentType<ConnectionFormProps>
  testConnection: (config: ConnectionConfig) => Promise<{ ok: boolean; error?: string }>
  sidebarSections: NavSection[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewComponents: Record<string, LazyExoticComponent<ComponentType<any>>>
  defaultView: string
  getDisplayName: (config: ConnectionConfig) => string
}

const registry = new Map<ConnectionType, ConnectionTypeDescriptor>()

export function registerConnectionType(descriptor: ConnectionTypeDescriptor) {
  registry.set(descriptor.type, descriptor)
}

export function getConnectionType(type: ConnectionType): ConnectionTypeDescriptor | undefined {
  return registry.get(type)
}

export function getRegisteredTypes(): ConnectionTypeDescriptor[] {
  return Array.from(registry.values())
}
