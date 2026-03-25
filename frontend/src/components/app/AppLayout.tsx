import { useState, useCallback } from "react";
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
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useResizable } from "../../hooks/useResizable";
import { executeQuery } from "../../lib/api";
import { toast } from "sonner";
import { LogoMark, GithubIcon } from "../icons";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";

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
  const { push: pushHistory } = useHistoryStore();
  const { save: saveQuery } = useSavedStore();
  const { containerRef, ratio, onMouseDown } = useResizable({
    initialRatio: 0.5,
  });

  const resetLayout = useCallback(() => {
    localStorage.removeItem('sidebar-width')
    localStorage.removeItem('query-sidebar-width')
    localStorage.removeItem('explorer-schemas-width')
    localStorage.removeItem('explorer-tables-width')
    toast.success('Layout reset - refresh to apply')
  }, [])

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
        connectionName:
          activeConnectionUrl.split("@").pop()?.split("/").pop() ?? "DB",
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg)]">
      {/* Header Nav */}
      <nav className="flex items-center justify-between px-8 h-16 border-b border-[var(--border)] bg-[var(--bg)] shrink-0 z-50">
        <div className="flex items-center gap-3">
          <LogoMark size={28} />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--fg)]">
            pgquery
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a
            href="/#features"
            className="text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          >
            Features
          </a>
          <a
            href="/#how"
            className="text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          >
            How it works
          </a>
          <a
            href="https://github.com/Hxndrik/pgquery"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors flex items-center gap-1.5"
          >
            <GithubIcon size={14} />
            GitHub
          </a>
        </div>

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
          <Link to="/">
            <Button variant="outline" size="sm" className="rounded-full">
              View Landing
            </Button>
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Unified Sidebar */}
        <Sidebar activeView={view} onViewChange={setView} />

        {/* Query Sidebar (History + Saved) - Only show in queries view */}
        {view === "queries" && <QuerySidebar />}

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {view === "queries" && (
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
          {view === "explorer" && (
            <TableExplorer connectionUrl={activeConnectionUrl} />
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
