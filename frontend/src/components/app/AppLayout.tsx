import { useState, useCallback, useEffect, Suspense } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useConnectionStore } from "../../stores/connectionStore";
import { useSchemaStore } from "../../stores/schemaStore";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { getConnectionType } from "../../lib/connectionRegistry";
import { isPostgresConfig } from "../../lib/connectionTypes";

// Ensure connection types are registered
import "../../lib/connectionTypes";

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

  const resetLayout = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  }, []);

  const renderContent = () => {
    if (!activeConnection || !descriptor) return <NotConnected />;

    const ViewComponent = descriptor.viewComponents[view];
    if (!ViewComponent) return <NotConnected />;

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

        {/* Main area -- dynamic based on connection type */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
