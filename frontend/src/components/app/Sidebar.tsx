import { useState, useCallback } from "react";
import { NavItem } from "./NavItem";
import { ConnectionManager } from "./ConnectionManager";
import {
  PlusIcon,
  EditIcon,
  ChevronDownIcon,
} from "../icons";
import { useConnectionStore } from "../../stores/connectionStore";
import { useResizableWidth } from "../../hooks/useResizableWidth";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { toast } from "sonner";
import { getConnectionType } from "../../lib/connectionRegistry";
import type { NavSection } from "../../lib/connectionRegistry";

// Import registrations
import "../../lib/connectionTypes";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

function CollapsibleSection({
  label,
  storageKey,
  children,
}: {
  label: string;
  storageKey: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === "true" : true;
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(storageKey, String(next));
  };

  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-4 py-1.5 group"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
          {label}
        </span>
        <span
          className={`text-[var(--fg-subtle)] transition-transform duration-150 ${
            open ? "" : "-rotate-90"
          }`}
        >
          <ChevronDownIcon size={12} />
        </span>
      </button>
      {open && <div className="flex flex-col gap-0.5 px-2 pb-1">{children}</div>}
    </div>
  );
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { width, onMouseDown } = useResizableWidth({
    storageKey: STORAGE_KEYS.SIDEBAR_WIDTH,
    initialWidth: 240,
  });
  const [connOpen, setConnOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { connections, activeConnectionId, status, setActiveConnection, setStatus } =
    useConnectionStore();

  const activeConnection = connections.find((c) => c.id === activeConnectionId);
  const activeType = activeConnection?.type;
  const descriptor = activeType ? getConnectionType(activeType) : undefined;
  const sections: NavSection[] = descriptor?.sidebarSections ?? [];

  const handleConnectionClick = useCallback(
    async (id: string) => {
      const conn = connections.find((c) => c.id === id);
      if (!conn) return;

      if (id === activeConnectionId) {
        setEditingId(id);
        setConnOpen(true);
      } else {
        setStatus("connecting");
        const desc = getConnectionType(conn.type);
        if (!desc) {
          setStatus("error");
          toast.error("Unknown connection type");
          return;
        }
        const result = await desc.testConnection(conn.config);
        if (result.ok) {
          setActiveConnection(id);
          setStatus("connected");
          // Switch to the default view for this connection type
          onViewChange(desc.defaultView);
          toast.success(`Connected to ${conn.name}`);
        } else {
          setStatus("error");
          toast.error(result.error ?? "Connection failed");
        }
      }
    },
    [activeConnectionId, connections, setActiveConnection, setStatus, onViewChange]
  );

  const handleAddNew = () => {
    setEditingId(null);
    setConnOpen(true);
  };

  return (
    <div
      style={{ width }}
      className="shrink-0 bg-[var(--bg-raised)] border-r border-[var(--border)] h-full flex flex-col relative"
    >
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--accent)] transition-colors z-10"
      />

      {/* Connection Section -- always visible */}
      <div className="px-3 mt-3">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
            Connections
          </span>
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
            className="flex items-center gap-2 px-3 py-1.5 rounded w-full text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] transition-colors"
          >
            <span className="text-[13px]">Add connection…</span>
          </button>
        ) : (
          <div className="flex flex-col gap-0.5">
            {connections.map((c) => {
              const isActive = c.id === activeConnectionId;
              const isConnected = isActive && status === "connected";
              const desc = getConnectionType(c.type);
              const TypeIcon = desc?.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => handleConnectionClick(c.id)}
                  title={isActive ? "Edit connection" : `Connect to ${c.name}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded w-full text-left transition-colors ${
                    isActive
                      ? "bg-[var(--bg-active)] text-[var(--fg)]"
                      : "text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]"
                  }`}
                >
                  <span
                    className={`shrink-0 ${
                      isConnected
                        ? "text-[var(--success)]"
                        : isActive
                        ? "text-[var(--warning)]"
                        : "text-[var(--fg-subtle)]"
                    }`}
                  >
                    {TypeIcon ? <TypeIcon size={14} /> : null}
                  </span>
                  <span className="truncate text-[13px] flex-1">{c.name}</span>
                  {isActive && (
                    <EditIcon size={12} className="shrink-0 text-[var(--fg-subtle)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] mx-3 my-2" />

      {/* Dynamic navigation sections -- driven by active connection type */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
        {sections.length > 0 ? (
          sections.map((section) => (
            <CollapsibleSection
              key={section.label}
              label={section.label}
              storageKey={section.storageKey}
            >
              {section.items.map((item) => (
                <NavItem
                  key={item.view}
                  icon={item.icon}
                  label={item.label}
                  active={activeView === item.view}
                  onClick={() => onViewChange(item.view)}
                />
              ))}
            </CollapsibleSection>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-[12px] text-[var(--fg-faint)]">
            Connect to get started
          </div>
        )}
      </div>

      <ConnectionManager
        open={connOpen}
        onClose={() => setConnOpen(false)}
        editingId={editingId}
      />
    </div>
  );
}
