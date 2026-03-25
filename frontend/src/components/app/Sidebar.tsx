import { useState } from "react";
import { NavItem } from "./NavItem";
import { ConnectionManager } from "./ConnectionManager";
import { LogoMark, QueryIcon, ExplorerIcon, ConnectionIcon } from "../icons";
import { useConnectionStore } from "../../stores/connectionStore";
import { useResizableWidth } from "../../hooks/useResizableWidth";
import { extractDbName } from "../../lib/connectionParser";

export type SidebarView = "queries" | "explorer";

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { width, onMouseDown } = useResizableWidth({ 
    storageKey: 'sidebar-width', 
    initialWidth: 280 
  });
  const [connOpen, setConnOpen] = useState(false);
  const { activeConnectionUrl, activeConnectionId, connections, status } =
    useConnectionStore();

  const activeConnection = connections.find((c) => c.id === activeConnectionId);
  const connectionName =
    activeConnection?.name ??
    (activeConnectionUrl ? (extractDbName(activeConnectionUrl) || "Connected") : "No connection");

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-[var(--success)]';
      case 'connecting':
        return 'text-[var(--warning)]';
      case 'error':
        return 'text-[var(--error)]';
      default:
        return 'text-[var(--fg-subtle)]';
    }
  };

  return (
    <div style={{ width }} className="shrink-0 bg-[var(--bg-raised)] border-r border-[var(--border)] h-full flex flex-col relative">
      <div 
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--accent)] transition-colors z-10"
      />
      <div className="p-4 flex items-center justify-center border-b border-[var(--border)]">
        <LogoMark size={32} />
      </div>

      {/* Connection Section */}
      <div className="px-3 mt-3">
        <button
          onClick={() => setConnOpen(true)}
          className="flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors w-full text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]"
        >
          <span className={`shrink-0 ${getStatusColor()}`}>
            <ConnectionIcon size={18} />
          </span>
          <span className="truncate flex-1 text-left">{connectionName}</span>
        </button>
      </div>

      <div className="border-t border-[var(--border)] mx-3 my-2" />

      <nav className="flex flex-col gap-1 px-3">
        <NavItem
          icon={<ExplorerIcon size={18} />}
          label="Explorer"
          active={activeView === "explorer"}
          onClick={() => onViewChange("explorer")}
        />
        <NavItem
          icon={<QueryIcon size={18} />}
          label="Queries"
          active={activeView === "queries"}
          onClick={() => onViewChange("queries")}
        />
      </nav>
      <div className="flex-1" />

      <ConnectionManager open={connOpen} onClose={() => setConnOpen(false)} />
    </div>
  );
}
