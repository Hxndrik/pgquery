import { useState, useEffect, useCallback } from 'react'
import { queryRecords, executeQuery } from '../../../lib/api'
import { listAvailableExtensions } from '../../../lib/pgCatalogQueries'
import { createExtension, dropExtension } from '../../../lib/ddlGenerators'
import { ObjectListPage } from './shared/ObjectListPage'
import { DDLPreviewModal } from './shared/DDLPreviewModal'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { ExtensionIcon } from '../../icons'
import { toast } from 'sonner'

interface PageProps {
  connectionUrl: string
}

interface Extension {
  name: string
  default_version: string
  installed_version: string | null
  comment: string | null
}

export default function ExtensionsPage({ connectionUrl }: PageProps) {
  const [items, setItems] = useState<Extension[]>([])
  const [loading, setLoading] = useState(true)

  // DDL modal state
  const [ddlOpen, setDdlOpen] = useState(false)
  const [ddlSql, setDdlSql] = useState('')
  const [ddlTitle, setDdlTitle] = useState('')
  const [ddlLoading, setDdlLoading] = useState(false)
  const [ddlError, setDdlError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const catalogQuery = listAvailableExtensions()
    const result = await queryRecords(connectionUrl, catalogQuery.query, catalogQuery.params ?? [])
    if (result.success) {
      setItems(
        result.data.map((row) => ({
          name: String(row.name ?? ''),
          default_version: String(row.default_version ?? ''),
          installed_version: row.installed_version != null ? String(row.installed_version) : null,
          comment: row.comment != null ? String(row.comment) : null,
        }))
      )
    } else {
      toast.error(`Failed to load extensions: ${result.error}`)
    }
    setLoading(false)
  }, [connectionUrl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleToggle = (ext: Extension) => {
    setDdlError(null)
    if (ext.installed_version) {
      setDdlTitle(`Uninstall Extension: ${ext.name}`)
      setDdlSql(dropExtension({ name: ext.name, ifExists: true, cascade: true }))
    } else {
      setDdlTitle(`Install Extension: ${ext.name}`)
      setDdlSql(createExtension({ name: ext.name, ifNotExists: true }))
    }
    setDdlOpen(true)
  }

  const handleExecute = async () => {
    setDdlLoading(true)
    setDdlError(null)
    const result = await executeQuery(connectionUrl, ddlSql)
    if (result.success) {
      toast.success('Extension operation completed successfully')
      setDdlOpen(false)
      fetchData()
    } else {
      setDdlError(result.error.error)
    }
    setDdlLoading(false)
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      width: '25%',
      render: (ext: Extension) => (
        <span className="font-medium text-[var(--fg)]">{ext.name}</span>
      ),
    },
    {
      key: 'installed_version',
      header: 'Status',
      width: '15%',
      render: (ext: Extension) =>
        ext.installed_version ? (
          <Badge variant="success">v{ext.installed_version}</Badge>
        ) : (
          <span className="text-[11px] text-[var(--fg-faint)]">Not installed</span>
        ),
    },
    {
      key: 'default_version',
      header: 'Default Version',
      width: '12%',
      render: (ext: Extension) => (
        <span className="text-[var(--fg-muted)]">{ext.default_version}</span>
      ),
    },
    {
      key: 'comment',
      header: 'Description',
      render: (ext: Extension) => (
        <span className="text-[var(--fg-muted)] font-sans">{ext.comment ?? ''}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (ext: Extension) => (
        <Button
          variant={ext.installed_version ? 'outline' : 'solid'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleToggle(ext)
          }}
        >
          {ext.installed_version ? 'Uninstall' : 'Install'}
        </Button>
      ),
    },
  ]

  return (
    <>
      <ObjectListPage
        title="Extensions"
        icon={<ExtensionIcon size={18} />}
        items={items}
        columns={columns}
        keyExtractor={(ext) => ext.name}
        loading={loading}
        onRefresh={fetchData}
        emptyMessage="No extensions available."
        searchPlaceholder="Filter extensions by name..."
      />

      <DDLPreviewModal
        open={ddlOpen}
        onClose={() => setDdlOpen(false)}
        onExecute={handleExecute}
        title={ddlTitle}
        sql={ddlSql}
        loading={ddlLoading}
        error={ddlError}
      />
    </>
  )
}
