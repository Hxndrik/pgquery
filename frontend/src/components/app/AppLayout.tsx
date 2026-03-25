import { useState, useCallback } from 'react'
import { Sidebar, type SidebarView } from './Sidebar'
import { TabBar } from './TabBar'
import { Editor } from './Editor'
import { RunBar } from './RunBar'
import { Results } from './Results'
import { TableExplorer } from './TableExplorer'
import { HistoryView } from './HistoryView'
import { SavedView } from './SavedView'
import { useTabStore } from '../../stores/tabStore'
import { useConnectionStore } from '../../stores/connectionStore'
import { useHistoryStore } from '../../stores/historyStore'
import { useSavedStore } from '../../stores/savedStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useResizable } from '../../hooks/useResizable'
import { executeQuery } from '../../lib/api'
import { toast } from 'sonner'

export default function AppLayout() {
  const [view, setView] = useState<SidebarView>('queries')
  const { tabs, activeTabId, addTab, closeTab, setLoading, setResult, setError } = useTabStore()
  const { activeConnectionUrl } = useConnectionStore()
  const { push: pushHistory } = useHistoryStore()
  const { save: saveQuery } = useSavedStore()
  const { containerRef, ratio, onMouseDown } = useResizable({ initialRatio: 0.5 })

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const runQuery = useCallback(async () => {
    if (!activeTab) return
    if (!activeConnectionUrl) {
      toast.error('No database connected')
      return
    }
    const sql = activeTab.sql.trim()
    if (!sql) return

    setLoading(activeTabId, true)
    const result = await executeQuery(activeConnectionUrl, sql)

    if (result.success) {
      setResult(activeTabId, result.data)
      pushHistory({
        query: sql,
        timestamp: Date.now(),
        duration: result.data.duration,
        rowCount: result.data.rowCount,
        connectionName: activeConnectionUrl.split('@').pop()?.split('/').pop() ?? 'DB',
      })
    } else {
      setError(activeTabId, result.error)
    }
  }, [activeTab, activeTabId, activeConnectionUrl, setLoading, setResult, setError, pushHistory])

  const saveCurrentQuery = useCallback(() => {
    if (!activeTab?.sql.trim()) return
    const name = prompt('Save query as:', activeTab.name) ?? activeTab.name
    saveQuery(name, activeTab.sql)
    toast.success(`Saved "${name}"`)
  }, [activeTab, saveQuery])

  useKeyboardShortcuts({
    onRun: runQuery,
    onSave: saveCurrentQuery,
    onNewTab: addTab,
    onCloseTab: () => closeTab(activeTabId),
  })

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Unified Sidebar */}
      <Sidebar activeView={view} onViewChange={setView} />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {view === 'queries' && (
          <>
            {/* Tab bar */}
            <TabBar />

            {/* Resizable editor + results */}
            <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden relative">
              {/* Editor pane */}
              <div style={{ height: `calc(${ratio * 100}% - 1px)` }} className="overflow-hidden">
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
              <div style={{ height: `calc(${(1 - ratio) * 100}% - 36px)` }} className="overflow-hidden">
                <Results result={activeTab?.result ?? null} error={activeTab?.error ?? null} />
              </div>
            </div>
          </>
        )}
        {view === 'explorer' && <TableExplorer connectionUrl={activeConnectionUrl} />}
        {view === 'history' && <HistoryView />}
        {view === 'saved' && <SavedView />}
      </div>
    </div>
  )
}
