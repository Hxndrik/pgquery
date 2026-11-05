import { useState, useCallback, useEffect, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { useConnectionStore } from "../../stores/connectionStore";
import { useSchemaStore } from "../../stores/schemaStore";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { getConnectionType } from "../../lib/connectionRegistry";
import { isPostgresConfig } from "../../lib/connectionTypes";
import { Tuple } from "../../brand/Pixel";
import { WelcomePanel } from "./WelcomePanel";
import { toast } from "sonner";
import { useConnectionHealth } from "../../stores/connectionHealthStore";
import { connectDemo, connectDemoBucket, isDemoUrl } from "../../lib/demo";
import { testConnection } from "../../lib/api";
import { Tooltip } from "../ui/Tooltip";

// Ensure connection types are registered
import "../../lib/connectionTypes";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full text-[13px] text-[var(--fg-faint)]">
      Loading…
    </div>
  );
}

export default function AppLayout() {
  const [view, setView] = useState<string>("explorer");
  // On phones the sidebar is a drawer behind the menu button.
  const [menuOpen, setMenuOpen] = useState(false);
  const changeView = useCallback((next: string) => {
    setView(next);
    setMenuOpen(false);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const { activeConnectionUrl } = useConnectionStore();
  const { loadSchema, clearSchema } = useSchemaStore();

  const activeConnection = useConnectionStore((s) => s.getActiveConnection());
  const activeType = activeConnection?.type;
  const descriptor = activeType ? getConnectionType(activeType) : undefined;

  useEffect(() => {
    if (activeConnectionUrl) {
      loadSchema(activeConnectionUrl);
    } else {
      clearSchema();
    }
  }, [activeConnectionUrl, loadSchema, clearSchema]);

  // Unencrypted connections get a warning. The demo is exempt: it is public,
  // read-only sample data reached from the server, not the user's database.
  const encrypted = useConnectionHealth((s) => (activeConnectionUrl ? s.encrypted[activeConnectionUrl] : undefined));
  const showUnencrypted = !!activeConnectionUrl && !isDemoUrl(activeConnectionUrl) && encrypted === false;
  useEffect(() => {
    // A connection restored from a previous visit hasn't been tested yet.
    if (activeConnectionUrl && !isDemoUrl(activeConnectionUrl) && useConnectionHealth.getState().encrypted[activeConnectionUrl] === undefined) {
      void testConnection(activeConnectionUrl);
    }
  }, [activeConnectionUrl]);

  // Tab title: connection and screen, so several open tabs can be told apart.
  useEffect(() => {
    const label = descriptor?.sidebarSections.flatMap((s) => s.items).find((i) => i.view === view)?.label;
    document.title = activeConnection
      ? `${activeConnection.name}${label ? ` · ${label}` : ""} — pgquery`
      : "Connect a database or bucket — pgquery";
  }, [activeConnection, descriptor, view]);

  // /app?demo (the landing page's "Open the demo" link) connects straight away;
  // /app?demo=s3 opens the demo bucket instead.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("demo")) return;
    const bucket = params.get("demo") === "s3";
    window.history.replaceState(null, "", window.location.pathname);
    (bucket ? connectDemoBucket() : connectDemo()).then((error) => {
      if (error) toast.error(error);
      else setView(bucket ? "s3-browser" : "queries");
    });
  }, []);

  const resetLayout = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  }, []);

  const renderContent = () => {
    const welcome = <WelcomePanel onConnected={changeView} />;
    if (!activeConnection || !descriptor) return welcome;

    const ViewComponent = descriptor.viewComponents[view];
    if (!ViewComponent) return welcome;

    // Build props based on connection type
    const viewProps: Record<string, unknown> = { config: activeConnection.config };
    if (isPostgresConfig(activeConnection.config)) {
      viewProps.connectionUrl = activeConnection.config.url;
    }

    return (
      <Suspense fallback={<PageLoader />}>
        <ViewComponent {...viewProps} />
      </Suspense>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg)]">
      {/* Header */}
      <nav className="flex items-center justify-between gap-4 pl-4 pr-3 h-12 border-b-[1.5px] border-[var(--border-strong)] bg-[var(--bg)] shrink-0 z-50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden -ml-2 p-2.5 rounded-sm text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M3 5h12M3 9h12M3 13h12" />}
            </svg>
          </button>
          <a href="/" className="flex items-center gap-2.5 group" aria-label="pgquery home">
            <Tuple style="dither" width={33} />
            <span className="text-[17px] font-black tracking-[-0.02em] [font-stretch:125%] text-[var(--fg)] group-hover:text-[var(--accent-text)] transition-colors">
              pgquery
            </span>
          </a>
        </div>

        {activeConnection && (
          <div className="hidden md:flex items-center gap-2 min-w-0 font-mono text-[12px] text-[var(--fg-muted)]">
            <span className="label">Connected</span>
            <span className="truncate text-[var(--fg)]">{activeConnection.name}</span>
            {showUnencrypted && (
              <Tooltip side="bottom" content="No SSL: add ?sslmode=require to refuse unencrypted connections">
                <span className="shrink-0 px-1.5 py-px rounded-sm border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)] text-[10.5px] uppercase tracking-[0.08em]">
                  Not encrypted
                </span>
              </Tooltip>
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/Hxndrik/pgquery"
            target="_blank"
            rel="noopener noreferrer"
            className="max-sm:hidden px-2.5 py-1 text-[12px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            GitHub
          </a>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={resetLayout} className="max-sm:hidden">
            Reset layout
          </Button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Unified Sidebar */}
        {menuOpen && (
          <div
            className="md:hidden fixed inset-x-0 top-12 bottom-0 z-30 bg-[var(--overlay)]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        <Sidebar activeView={view} onViewChange={changeView} mobileOpen={menuOpen} onCloseMenu={() => setMenuOpen(false)} />

        {/* Main area -- dynamic based on connection type */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
