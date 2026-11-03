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
import { connectDemo } from "../../lib/demo";
import { toast } from "sonner";

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

  // /app?demo (the landing page's "Open the demo" link) connects straight away.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("demo")) return;
    window.history.replaceState(null, "", window.location.pathname);
    connectDemo().then((error) => {
      if (error) toast.error(error);
      else setView("queries");
    });
  }, []);

  const resetLayout = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  }, []);

  const renderContent = () => {
    const welcome = <WelcomePanel onConnected={() => setView("queries")} />;
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
        <a href="/" className="flex items-center gap-2.5 group" aria-label="pgquery home">
          <Tuple style="dither" width={33} />
          <span className="text-[17px] font-black tracking-[-0.02em] [font-stretch:125%] text-[var(--fg)] group-hover:text-[var(--accent-text)] transition-colors">
            pgquery
          </span>
        </a>

        {activeConnection && (
          <div className="hidden md:flex items-center gap-2 min-w-0 font-mono text-[12px] text-[var(--fg-muted)]">
            <span className="label">Connected</span>
            <span className="truncate text-[var(--fg)]">{activeConnection.name}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/Hxndrik/pgquery"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 text-[12px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            GitHub
          </a>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={resetLayout}>
            Reset layout
          </Button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Unified Sidebar */}
        <Sidebar activeView={view} onViewChange={setView} />

        {/* Main area -- dynamic based on connection type */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
