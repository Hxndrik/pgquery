import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Sidebar, type SidebarView } from "./Sidebar";
import { QuerySidebar } from "./QuerySidebar";
import { SaveQueryDialog } from "./SaveQueryDialog";
import { TabBar } from "./TabBar";
import { Editor } from "./Editor";
import { RunBar } from "./RunBar";
import { Results } from "./Results";
import { TableExplorer } from "./TableExplorer";
import { useTabStore } from "../../stores/tabStore";
import { useConnectionStore } from "../../stores/connectionStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useSavedStore } from "../../stores/savedStore";
import { useSchemaStore } from "../../stores/schemaStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useResizable } from "../../hooks/useResizable";
import { executeQuery } from "../../lib/api";
import { extractDbName } from "../../lib/connectionParser";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";

// Lazy-load database pages
const FunctionsPage = lazy(() => import("./DatabasePages/FunctionsPage"));
const TriggersPage = lazy(() => import("./DatabasePages/TriggersPage"));
const EnumTypesPage = lazy(() => import("./DatabasePages/EnumTypesPage"));
const ExtensionsPage = lazy(() => import("./DatabasePages/ExtensionsPage"));
const IndexesPage = lazy(() => import("./DatabasePages/IndexesPage"));
const PublicationsPage = lazy(() => import("./DatabasePages/PublicationsPage"));
const RolesPage = lazy(() => import("./DatabasePages/RolesPage"));
const PoliciesPage = lazy(() => import("./DatabasePages/PoliciesPage"));
const SettingsPage = lazy(() => import("./DatabasePages/SettingsPage"));
const SecurityAdvisorPage = lazy(() => import("./DatabasePages/SecurityAdvisorPage"));
const PerformanceAdvisorPage = lazy(() => import("./DatabasePages/PerformanceAdvisorPage"));
const QueryPerformancePage = lazy(() => import("./DatabasePages/QueryPerformancePage"));
const SchemaVisualizerPage = lazy(() => import("./DatabasePages/SchemaVisualizerPage"));
const ReplicationPage = lazy(() => import("./DatabasePages/ReplicationPage"));
const WrappersPage = lazy(() => import("./DatabasePages/WrappersPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full text-[13px] text-[var(--fg-faint)]">
      Loading…
    </div>
  );
}

function NotConnected() {
  return (
    <div className="flex items-center justify-center h-full text-[13px] text-[var(--fg-faint)]">
      Connect to a database to get started
    </div>
  );
}

export default function AppLayout() {
  const [view, setView] = useState<SidebarView>("explorer");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    setLoading,
    setResult,
    setError,
  } = useTabStore();
  const { activeConnectionUrl } = useConnectionStore();
  const { loadSchema, clearSchema } = useSchemaStore();
  const { push: pushHistory } = useHistoryStore();

  useEffect(() => {
    if (activeConnectionUrl) {
      loadSchema(activeConnectionUrl);
    } else {
      clearSchema();
    }
  }, [activeConnectionUrl, loadSchema, clearSchema]);
  const { save: saveQuery } = useSavedStore();
  const { containerRef, ratio, onMouseDown } = useResizable({
    initialRatio: 0.5,
  });

  const resetLayout = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const runQuery = useCallback(async () => {
    if (!activeTab) return;
    if (!activeConnectionUrl) {
      toast.error("No database connected");
      return;
    }
    const sql = activeTab.sql.trim();
    if (!sql) return;

    setLoading(activeTabId, true);
    const result = await executeQuery(activeConnectionUrl, sql);

    if (result.success) {
      setResult(activeTabId, result.data);
      pushHistory({
        query: sql,
        timestamp: Date.now(),
        duration: result.data.duration,
        rowCount: result.data.rowCount,
        connectionName: extractDbName(activeConnectionUrl) || "DB",
      });
    } else {
      setError(activeTabId, result.error);
    }
  }, [
    activeTab,
    activeTabId,
    activeConnectionUrl,
    setLoading,
    setResult,
    setError,
    pushHistory,
  ]);

  const saveCurrentQuery = useCallback(
    (name: string) => {
      if (!activeTab?.sql.trim()) return;
      saveQuery(name, activeTab.sql);
      toast.success(`Saved "${name}"`);
    },
    [activeTab, saveQuery],
  );

  const handleSaveShortcut = useCallback(() => {
    if (!activeTab?.sql.trim()) return;
    setSaveDialogOpen(true);
  }, [activeTab]);

  useKeyboardShortcuts({
    onRun: runQuery,
    onSave: handleSaveShortcut,
    onNewTab: addTab,
    onCloseTab: () => closeTab(activeTabId),
  });

  const renderDatabasePage = () => {
    if (!activeConnectionUrl) return <NotConnected />;

    const pageProps = { connectionUrl: activeConnectionUrl };

    const pages: Record<string, React.ReactNode> = {
      functions: <FunctionsPage {...pageProps} />,
      triggers: <TriggersPage {...pageProps} />,
      enums: <EnumTypesPage {...pageProps} />,
      extensions: <ExtensionsPage {...pageProps} />,
      indexes: <IndexesPage {...pageProps} />,
      publications: <PublicationsPage {...pageProps} />,
      roles: <RolesPage {...pageProps} />,
      policies: <PoliciesPage {...pageProps} />,
      settings: <SettingsPage {...pageProps} />,
      "security-advisor": <SecurityAdvisorPage {...pageProps} />,
      "performance-advisor": <PerformanceAdvisorPage {...pageProps} />,
      "query-performance": <QueryPerformancePage {...pageProps} />,
      "schema-visualizer": <SchemaVisualizerPage {...pageProps} />,
      replication: <ReplicationPage {...pageProps} />,
      wrappers: <WrappersPage {...pageProps} />,
    };

    return pages[view] ?? null;
  };

  const isQueryView = view === "queries";
  const isExplorerView = view === "explorer";
  const isDatabasePage = !isQueryView && !isExplorerView;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg)]">
      {/* Header Nav */}
      <nav className="flex items-center justify-between px-8 h-14 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md shrink-0 z-50">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <span className="text-[15px] font-semibold tracking-tight text-[var(--fg)]">
            pgquery
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetLayout}
            className="text-[13px]"
          >
            Reset Layout
          </Button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Unified Sidebar */}
        <Sidebar activeView={view} onViewChange={setView} />

        {/* Query Sidebar (History + Saved) - Only show in queries view */}
        {isQueryView && <QuerySidebar />}

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {isQueryView && (
            <>
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
            </>
          )}
          {isExplorerView && (
            <TableExplorer connectionUrl={activeConnectionUrl} />
          )}
          {isDatabasePage && (
            <Suspense fallback={<PageLoader />}>
              {renderDatabasePage()}
            </Suspense>
          )}
        </div>
      </div>

      {/* Save Query Dialog */}
      <SaveQueryDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={saveCurrentQuery}
        initialName={activeTab?.name}
      />
    </div>
  );
}
