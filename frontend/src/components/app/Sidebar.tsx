import { useState, useCallback } from "react";
import { NavItem } from "./NavItem";
import { ConnectionManager } from "./ConnectionManager";
import { QueryIcon, ExplorerIcon, ConnectionIcon, PlusIcon, EditIcon } from "../icons";
import { useConnectionStore } from "../../stores/connectionStore";
import { useResizableWidth } from "../../hooks/useResizableWidth";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { testConnection } from "../../lib/api";
import { toast } from "sonner";

export type SidebarView = "queries" | "explorer";

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { width, onMouseDown } = useResizableWidth({
    storageKey: STORAGE_KEYS.SIDEBAR_WIDTH,
    initialWidth: 280
  });
  const [connOpen, setConnOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { connections, activeConnectionId, status, setActiveConnection, setStatus } =
    useConnectionStore();

  const handleConnectionClick = useCallback(async (id: string, url: string) => {
    if (id === activeConnectionId) {
      setEditingId(id);
      setConnOpen(true);
    } else {
      setStatus('connecting');
      const result = await testConnection(url);
      if (result.ok) {
        setActiveConnection(id, url);
        setStatus('connected');
        toast.success(`Connected to ${result.database}`);
      } else {
        setStatus('error');
        toast.error(result.error ?? 'Connection failed');
      }
    }
  }, [activeConnectionId, setActiveConnection, setStatus]);

  const handleAddNew = () => {
    setEditingId(null);
    setConnOpen(true);
  };

  return (
    <div style={{ width }} className="shrink-0 bg-[var(--bg-raised)] border-r border-[var(--border)] h-full flex flex-col relative">
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--accent)] transition-colors z-10"
      />

      {/* Connection Section */}
      <div className="px-3 mt-4">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--fg-subtle)]">Connections</span>
          <button
            onClick={handleAddNew}
            className="p-0.5 text-[var(--fg-subtle)] hover:text-[var(--fg)] rounded hover:bg-[var(--bg-hover)] transition-colors"
            title="New connection"
          >
            <PlusIcon size={14} />
          </button>
        </div>
        {connections.length === 0 ? (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-3 py-2 rounded w-full text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] transition-colors"
          >
            <ConnectionIcon size={14} className="shrink-0" />
            <span className="text-[13px]">Add connection…</span>
          </button>
        ) : (
          <div className="flex flex-col gap-0.5">
            {connections.map((c) => {
              const isActive = c.id === activeConnectionId;
              const isConnected = isActive && status === 'connected';
              return (
                <button
                  key={c.id}
                  onClick={() => handleConnectionClick(c.id, c.url)}
                  title={isActive ? 'Edit connection' : `Connect to ${c.name}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded w-full text-left transition-colors ${
                    isActive
                      ? 'bg-[var(--bg-active)] text-[var(--fg)]'
                      : 'text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]'
                  }`}
                >
                  <span className={`shrink-0 ${isConnected ? 'text-[var(--success)]' : isActive ? 'text-[var(--warning)]' : 'text-[var(--fg-subtle)]'}`}>
                    <ConnectionIcon size={14} />
                  </span>
                  <span className="truncate text-[13px] flex-1">{c.name}</span>
                  {isActive && <EditIcon size={12} className="shrink-0 text-[var(--fg-subtle)]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] mx-3 my-3" />

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

      <ConnectionManager open={connOpen} onClose={() => setConnOpen(false)} editingId={editingId} />
    </div>
  );
}
