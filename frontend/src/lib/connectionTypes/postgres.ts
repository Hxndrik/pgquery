import { lazy } from 'react'
import { registerConnectionType } from '../connectionRegistry'
import type { ConnectionConfig } from './types'
import { isPostgresConfig } from './types'
import { testConnection } from '../api'
import { DatabaseIcon } from '../../components/icons'
import { createElement } from 'react'
import { PixelIcon } from '../../brand/Pixel'
import type { IconName } from '../../brand/pixels'

const icon = (name: IconName) => createElement(PixelIcon, { name, size: 15 })

registerConnectionType({
  type: 'postgres',
  label: 'PostgreSQL',
  icon: DatabaseIcon,
  formComponent: lazy(() => import('../../components/app/PostgresConnectionForm')),
  testConnection: async (config: ConnectionConfig) => {
    if (!isPostgresConfig(config)) return { ok: false, error: 'Invalid config' }
    return testConnection(config.url)
  },
  sidebarSections: [
    {
      label: 'Database',
      storageKey: 'nav-db-open',
      items: [
        { view: 'queries', icon: icon('editor'), label: 'SQL Editor' },
        { view: 'explorer', icon: icon('table'), label: 'Tables' },
        { view: 'schema-visualizer', icon: icon('schema'), label: 'Schema Visualizer' },
        { view: 'functions', icon: icon('fn'), label: 'Functions' },
        { view: 'triggers', icon: icon('trigger'), label: 'Triggers' },
        { view: 'enums', icon: icon('enum'), label: 'Enumerated Types' },
        { view: 'extensions', icon: icon('plug'), label: 'Extensions' },
        { view: 'indexes', icon: icon('index'), label: 'Indexes' },
        { view: 'publications', icon: icon('replica'), label: 'Publications' },
      ],
    },
    {
      label: 'Configuration',
      storageKey: 'nav-config-open',
      items: [
        { view: 'roles', icon: icon('roles'), label: 'Roles' },
        { view: 'policies', icon: icon('key'), label: 'Policies' },
        { view: 'settings', icon: icon('gear'), label: 'Settings' },
      ],
    },
    {
      label: 'Platform',
      storageKey: 'nav-platform-open',
      items: [
        { view: 'replication', icon: icon('replica'), label: 'Replication' },
        { view: 'wrappers', icon: icon('cube'), label: 'Wrappers' },
      ],
    },
    {
      label: 'Tools',
      storageKey: 'nav-tools-open',
      items: [
        { view: 'security-advisor', icon: icon('shield'), label: 'Security Advisor' },
        { view: 'performance-advisor', icon: icon('lens'), label: 'Performance Advisor' },
        { view: 'query-performance', icon: icon('bolt'), label: 'Query Performance' },
      ],
    },
  ],
  viewComponents: {
    queries: lazy(() => import('../../components/app/PostgresQueryView')),
    explorer: lazy(() => import('../../components/app/TableExplorer').then(m => ({ default: m.TableExplorer }))),
    functions: lazy(() => import('../../components/app/DatabasePages/FunctionsPage')),
    triggers: lazy(() => import('../../components/app/DatabasePages/TriggersPage')),
    enums: lazy(() => import('../../components/app/DatabasePages/EnumTypesPage')),
    extensions: lazy(() => import('../../components/app/DatabasePages/ExtensionsPage')),
    indexes: lazy(() => import('../../components/app/DatabasePages/IndexesPage')),
    publications: lazy(() => import('../../components/app/DatabasePages/PublicationsPage')),
    roles: lazy(() => import('../../components/app/DatabasePages/RolesPage')),
    policies: lazy(() => import('../../components/app/DatabasePages/PoliciesPage')),
    settings: lazy(() => import('../../components/app/DatabasePages/SettingsPage')),
    'security-advisor': lazy(() => import('../../components/app/DatabasePages/SecurityAdvisorPage')),
    'performance-advisor': lazy(() => import('../../components/app/DatabasePages/PerformanceAdvisorPage')),
    'query-performance': lazy(() => import('../../components/app/DatabasePages/QueryPerformancePage')),
    'schema-visualizer': lazy(() => import('../../components/app/DatabasePages/SchemaVisualizerPage')),
    replication: lazy(() => import('../../components/app/DatabasePages/ReplicationPage')),
    wrappers: lazy(() => import('../../components/app/DatabasePages/WrappersPage')),
  },
  defaultView: 'explorer',
  getDisplayName: (config: ConnectionConfig) => {
    if (!isPostgresConfig(config)) return 'Unknown'
    try {
      const url = new URL(config.url)
      return url.pathname.slice(1) || url.hostname
    } catch {
      return 'PostgreSQL'
    }
  },
})
