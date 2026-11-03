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
import { PlanView } from './PlanView'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { explainSql, isDataModifying, parsePlan, type Plan } from '../../lib/plan'

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
  // Plans are per tab and not persisted; running the query again clears it.
  const [plans, setPlans] = useState<Record<string, Plan>>({})
  const [confirmAnalyze, setConfirmAnalyze] = useState(false)
  const plan = plans[activeTabId]
  const clearPlan = useCallback(
    (id: string) => setPlans((p) => (id in p ? Object.fromEntries(Object.entries(p).filter(([k]) => k !== id)) : p)),
    [],
  )

  const runQuery = useCallback(async () => {
    if (!activeTab) return
    if (!connectionUrl) {
      toast.error('No database connected')
      return
    }
    const sql = activeTab.sql.trim()
    if (!sql) return

    clearPlan(activeTabId)
    setLoading(activeTabId, true)
    // Text mode: every value exactly as Postgres prints it (no lost digits).
    const result = await executeQuery(connectionUrl, sql, [], { text: true })

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
    clearPlan,
  ])

  const explain = useCallback(
    async (analyze: boolean, confirmed = false) => {
      const sql = activeTab?.sql.trim()
      if (!sql || !connectionUrl) return
      if (analyze && !confirmed && isDataModifying(sql)) {
        setConfirmAnalyze(true)
        return
      }
      const tabId = activeTabId
      setLoading(tabId, true)
      const result = await executeQuery(connectionUrl, explainSql(sql, analyze))
      setLoading(tabId, false)
      if (!result.success) {
        setError(tabId, result.error)
        return
      }
      try {
        const parsed = parsePlan(result.data.rows[0]?.[0])
        setPlans((p) => ({ ...p, [tabId]: parsed }))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not read the plan')
      }
    },
    [activeTab, activeTabId, connectionUrl, setLoading, setError],
  )

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
            onExplain={explain}
            isLoading={activeTab?.isLoading ?? false}
            rowCount={activeTab?.result?.rowCount}
            duration={activeTab?.result?.duration}
          />

          {/* Results pane */}
          <div
            style={{ height: `calc(${(1 - ratio) * 100}% - 36px)` }}
            className="overflow-hidden"
          >
            {plan && !activeTab?.isLoading ? (
              <PlanView plan={plan} />
            ) : (
              <Results
                result={activeTab?.result ?? null}
                error={activeTab?.error ?? null}
              />
            )}
          </div>
        </div>
      </div>

      <Modal open={confirmAnalyze} onClose={() => setConfirmAnalyze(false)} title="Run this statement?">
        <div className="flex flex-col gap-4 text-[13px]">
          <p>
            EXPLAIN ANALYZE executes the statement to measure it, so this change will really happen. To measure it
            without keeping the change, wrap it in <code className="font-mono">BEGIN; … ROLLBACK;</code> and run that.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmAnalyze(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setConfirmAnalyze(false)
                explain(true, true)
              }}
            >
              Run and analyze
            </Button>
          </div>
        </div>
      </Modal>

      <SaveQueryDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={saveCurrentQuery}
        initialName={activeTab?.name}
      />
    </div>
  )
}
