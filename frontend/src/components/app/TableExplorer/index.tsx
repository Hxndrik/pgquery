import { useState, useEffect } from 'react'
import { TableDataView } from './TableDataView'
import { ExplorerSection } from './ExplorerSection'
import { type SchemaColumn } from '../../../lib/api'
import { useSchemaStore } from '../../../stores/schemaStore'
import { SchemaIcon, TableGridIcon } from '../../icons'
import { STORAGE_KEYS } from '../../../lib/storageKeys'

interface TableExplorerProps {
  connectionUrl: string | null
}

function formatRowCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(n)
}

export function TableExplorer({ connectionUrl }: TableExplorerProps) {
  const { schema, isLoading: loading } = useSchemaStore()
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  // Auto-select first schema/table when schema loads or connection changes
  useEffect(() => {
    if (!connectionUrl) {
      setSelectedSchema(null)
      setSelectedTable(null)
      return
    }
    if (schema?.schemas[0]) {
      setSelectedSchema(schema.schemas[0].name)
      setSelectedTable(schema.schemas[0].tables[0]?.name ?? null)
    }
  }, [connectionUrl, schema])

  const activeSchemaData = schema?.schemas.find((s) => s.name === selectedSchema) ?? null

  const activeColumns: SchemaColumn[] = (() => {
    if (!activeSchemaData || !selectedTable) return []
    return activeSchemaData.tables.find((t) => t.name === selectedTable)?.columns ?? []
  })()

  const handleSchemaSelect = (schemaName: string) => {
    setSelectedSchema(schemaName)
    const sc = schema?.schemas.find((s) => s.name === schemaName)
    setSelectedTable(sc?.tables[0]?.name ?? null)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <ExplorerSection
        title="Schemas"
        icon={<SchemaIcon size={14} />}
        items={schema?.schemas ?? []}
        selectedItem={selectedSchema}
        onSelectItem={handleSchemaSelect}
        keyExtractor={(s) => s.name}
        renderItem={(s, isActive) => (
          <>
            <span className="text-[12px] font-mono truncate flex-1">{s.name}</span>
            <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--fg-faint)]'}`}>
              {s.tables.length}
            </span>
          </>
        )}
        searchable={true}
        loading={loading}
        emptyMessage="No schemas"
        storageKey={STORAGE_KEYS.EXPLORER_SCHEMAS_WIDTH}
        initialWidth={160}
      />

      <ExplorerSection
        title="Tables"
        icon={<TableGridIcon size={14} />}
        items={activeSchemaData?.tables ?? []}
        selectedItem={selectedTable}
        onSelectItem={setSelectedTable}
        keyExtractor={(t) => t.name}
        renderItem={(t, isActive) => (
          <>
            <span className="text-[12px] font-mono flex-1 truncate">{t.name}</span>
            {t.rowEstimate > 0 && (
              <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--fg-faint)]'}`}>
                {formatRowCount(t.rowEstimate)}
              </span>
            )}
          </>
        )}
        searchable={true}
        emptyMessage={!selectedSchema ? 'Select a schema' : 'No tables'}
        storageKey={STORAGE_KEYS.EXPLORER_TABLES_WIDTH}
        initialWidth={220}
      />

      <div className="flex-1 overflow-hidden">
        {connectionUrl && selectedSchema && selectedTable ? (
          <TableDataView
            key={`${selectedSchema}.${selectedTable}`}
            connectionUrl={connectionUrl}
            schemaName={selectedSchema}
            tableName={selectedTable}
            columns={activeColumns}
            onTableDropped={() => setSelectedTable(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[13px] text-[var(--fg-faint)]">
            {connectionUrl ? 'Select a table to explore' : 'Connect to a database to get started'}
          </div>
        )}
      </div>
    </div>
  )
}
