import { ExplorerSection } from './TableExplorer/ExplorerSection'
import { SchemaIcon } from '../icons'
import { useConnectionStore } from '../../stores/connectionStore'
import { fetchSchema } from '../../lib/api'
import { useState, useEffect } from 'react'

export function SchemaView() {
  const { activeConnectionUrl } = useConnectionStore()
  const [schemas, setSchemas] = useState<Array<{ name: string; tables: any[] }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeConnectionUrl) {
      setSchemas([])
      return
    }
    setLoading(true)
    fetchSchema(activeConnectionUrl).then((s) => {
      setSchemas(s?.schemas ?? [])
      setLoading(false)
    })
  }, [activeConnectionUrl])

  return (
    <div className="h-full bg-[var(--bg)]">
      <ExplorerSection
        title="Database Schemas"
        icon={<SchemaIcon size={14} />}
        items={schemas}
        selectedItem={null}
        onSelectItem={() => {}}
        keyExtractor={(s) => s.name}
        renderItem={(s) => (
          <>
            <span className="text-[12px] font-mono truncate flex-1">{s.name}</span>
            <span className="text-[10px] font-mono shrink-0 text-[var(--fg-faint)]">
              {s.tables.length} {s.tables.length === 1 ? 'table' : 'tables'}
            </span>
          </>
        )}
        searchable={true}
        loading={loading}
        emptyMessage={activeConnectionUrl ? 'No schemas found' : 'Connect to a database'}
        width="w-full"
      />
    </div>
  )
}
