import { lazy } from 'react'
import { registerConnectionType } from '../connectionRegistry'
import type { ConnectionConfig } from './types'
import { isS3Config } from './types'
import { testS3Connection } from '../s3Api'
import { createElement } from 'react'

// We'll use existing icons that fit S3 semantics
import { ExplorerIcon, SchemaIcon } from '../../components/icons'
// S3Icon will be added to the icons file
import { S3Icon } from '../../components/icons'

const icon = (Icon: typeof ExplorerIcon, size = 16) => createElement(Icon, { size })

registerConnectionType({
  type: 's3',
  label: 'S3',
  icon: S3Icon,
  formComponent: lazy(() => import('../../components/app/S3/S3ConnectionForm')),
  testConnection: async (config: ConnectionConfig) => {
    if (!isS3Config(config)) return { ok: false, error: 'Invalid config' }
    return testS3Connection(config)
  },
  sidebarSections: [
    {
      label: 'Storage',
      storageKey: 'nav-s3-storage-open',
      items: [
        { view: 's3-browser', icon: icon(ExplorerIcon), label: 'Object Browser' },
        { view: 's3-bucket-info', icon: icon(SchemaIcon), label: 'Bucket Info' },
      ],
    },
  ],
  viewComponents: {
    's3-browser': lazy(() => import('../../components/app/S3/S3ObjectBrowser')),
    's3-bucket-info': lazy(() => import('../../components/app/S3/S3BucketInfo')),
  },
  defaultView: 's3-browser',
  getDisplayName: (config: ConnectionConfig) => {
    if (!isS3Config(config)) return 'Unknown'
    return config.bucket
  },
})
