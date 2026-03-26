import { lazy } from 'react'
import { registerConnectionType } from '../connectionRegistry'
import type { ConnectionConfig } from './types'
import { isPostgresConfig } from './types'
import { testConnection } from '../api'
import {
  QueryIcon,
  ExplorerIcon,
  SchemaVisualizerIcon,
  FunctionIcon,
  TriggerIcon,
  EnumIcon,
  ExtensionIcon,
  IndexIcon,
  PublicationIcon,
  RoleIcon,
  PolicyIcon,
  SettingsIcon,
  SecurityIcon,
  PerformanceIcon,
  QueryStatsIcon,
  ReplicationIcon,
  WrapperIcon,
  DatabaseIcon,
} from '../../components/icons'
import { createElement } from 'react'

const icon = (Icon: typeof QueryIcon, size = 16) => createElement(Icon, { size })

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
        { view: 'queries', icon: icon(QueryIcon), label: 'SQL Editor' },
        { view: 'explorer', icon: icon(ExplorerIcon), label: 'Tables' },
        { view: 'schema-visualizer', icon: icon(SchemaVisualizerIcon), label: 'Schema Visualizer' },
        { view: 'functions', icon: icon(FunctionIcon), label: 'Functions' },
        { view: 'triggers', icon: icon(TriggerIcon), label: 'Triggers' },
        { view: 'enums', icon: icon(EnumIcon), label: 'Enumerated Types' },
        { view: 'extensions', icon: icon(ExtensionIcon), label: 'Extensions' },
        { view: 'indexes', icon: icon(IndexIcon), label: 'Indexes' },
        { view: 'publications', icon: icon(PublicationIcon), label: 'Publications' },
      ],
    },
    {
      label: 'Configuration',
      storageKey: 'nav-config-open',
      items: [
        { view: 'roles', icon: icon(RoleIcon), label: 'Roles' },
        { view: 'policies', icon: icon(PolicyIcon), label: 'Policies' },
        { view: 'settings', icon: icon(SettingsIcon), label: 'Settings' },
      ],
    },
    {
      label: 'Platform',
      storageKey: 'nav-platform-open',
      items: [
        { view: 'replication', icon: icon(ReplicationIcon), label: 'Replication' },
        { view: 'wrappers', icon: icon(WrapperIcon), label: 'Wrappers' },
      ],
    },
    {
      label: 'Tools',
      storageKey: 'nav-tools-open',
      items: [
        { view: 'security-advisor', icon: icon(SecurityIcon), label: 'Security Advisor' },
        { view: 'performance-advisor', icon: icon(PerformanceIcon), label: 'Performance Advisor' },
        { view: 'query-performance', icon: icon(QueryStatsIcon), label: 'Query Performance' },
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
