import { useState, useCallback } from 'react'
import { QuerySidebar } from './QuerySidebar'
import { SaveQueryDialog } from './SaveQueryDialog'
import { TabBar } from './TabBar'
import { Editor } from './Editor'
import { RunBar } from './RunBar'
import { Results } from './Results'
import { useTabStore } from '../../stores/tabStore'
import { useHistoryStore } from '../../stores/historyStore'
import { useSavedStore } from '../../stores/savedStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useResizable } from '../../hooks/useResizable'
import { executeQuery } from '../../lib/api'
import { extractDbName } from '../../lib/connectionParser'
import { toast } from 'sonner'

interface PostgresQueryViewProps {
  connectionUrl: string
}

export default function PostgresQueryView({ connectionUrl }: PostgresQueryViewProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    setLoading,
    setResult,
    setError,
  } = useTabStore()
  const { push: pushHistory } = useHistoryStore()
  const { save: saveQuery } = useSavedStore()
  const { containerRef, ratio, onMouseDown } = useResizable({
    initialRatio: 0.5,
  })

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const runQuery = useCallback(async () => {
    if (!activeTab) return
    if (!connectionUrl) {
      toast.error('No database connected')
      return
    }
    const sql = activeTab.sql.trim()
    if (!sql) return

    setLoading(activeTabId, true)
    const result = await executeQuery(connectionUrl, sql)

    if (result.success) {
      setResult(activeTabId, result.data)
      pushHistory({
        query: sql,
        timestamp: Date.now(),
        duration: result.data.duration,
        rowCount: result.data.rowCount,
        connectionName: extractDbName(connectionUrl) || 'DB',
      })
    } else {
      setError(activeTabId, result.error)
    }
  }, [
    activeTab,
    activeTabId,
    connectionUrl,
    setLoading,
    setResult,
    setError,
    pushHistory,
  ])

  const saveCurrentQuery = useCallback(
    (name: string) => {
      if (!activeTab?.sql.trim()) return
      saveQuery(name, activeTab.sql)
      toast.success(`Saved "${name}"`)
    },
    [activeTab, saveQuery],
  )

  const handleSaveShortcut = useCallback(() => {
    if (!activeTab?.sql.trim()) return
    setSaveDialogOpen(true)
  }, [activeTab])

  useKeyboardShortcuts({
    onRun: runQuery,
    onSave: handleSaveShortcut,
    onNewTab: addTab,
    onCloseTab: () => closeTab(activeTabId),
  })

  return (
    <div className="flex flex-1 overflow-hidden">
      <QuerySidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Tab bar */}
        <TabBar />

        {/* Resizable editor + results */}
        <div
          ref={containerRef}
          className="flex-1 flex flex-col overflow-hidden relative"
        >
          {/* Editor pane */}
          <div
            style={{ height: `calc(${ratio * 100}% - 1px)` }}
            className="overflow-hidden"
          >
            <Editor tabId={activeTabId} onRun={runQuery} />
          </div>

          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            className="h-1 bg-[var(--border)] hover:bg-[var(--accent)] cursor-row-resize shrink-0 transition-colors relative z-10"
          />

          {/* Run bar */}
          <RunBar
            onRun={runQuery}
            isLoading={activeTab?.isLoading ?? false}
            rowCount={activeTab?.result?.rowCount}
            duration={activeTab?.result?.duration}
          />

          {/* Results pane */}
          <div
            style={{ height: `calc(${(1 - ratio) * 100}% - 36px)` }}
            className="overflow-hidden"
          >
            <Results
              result={activeTab?.result ?? null}
              error={activeTab?.error ?? null}
            />
          </div>
        </div>
      </div>

      <SaveQueryDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={saveCurrentQuery}
        initialName={activeTab?.name}
      />
    </div>
  )
}
