import { useState, useCallback } from "react";
import { NavItem } from "./NavItem";
import { ConnectionManager } from "./ConnectionManager";
import {
  QueryIcon,
  ExplorerIcon,
  ConnectionIcon,
  PlusIcon,
  EditIcon,
  FunctionIcon,
  TriggerIcon,
  EnumIcon,
  ExtensionIcon,
  IndexIcon,
  PublicationIcon,
  RoleIcon,
  PolicyIcon,
  SettingsIcon,
  SecurityIcon,
  PerformanceIcon,
  QueryStatsIcon,
  SchemaVisualizerIcon,
  ChevronDownIcon,
  ReplicationIcon,
  WrapperIcon,
} from "../icons";
import { useConnectionStore } from "../../stores/connectionStore";
import { useResizableWidth } from "../../hooks/useResizableWidth";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { testConnection } from "../../lib/api";
import { toast } from "sonner";

export type SidebarView =
  | "queries"
  | "explorer"
  | "functions"
  | "triggers"
  | "enums"
  | "extensions"
  | "indexes"
  | "publications"
  | "roles"
  | "policies"
  | "settings"
  | "security-advisor"
  | "performance-advisor"
  | "query-performance"
  | "schema-visualizer"
  | "replication"
  | "wrappers";

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

interface NavSection {
  label: string;
  storageKey: string;
  items: { view: SidebarView; icon: React.ReactNode; label: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Database",
    storageKey: "nav-db-open",
    items: [
      { view: "explorer", icon: <ExplorerIcon size={16} />, label: "Tables" },
      { view: "schema-visualizer", icon: <SchemaVisualizerIcon size={16} />, label: "Schema Visualizer" },
      { view: "functions", icon: <FunctionIcon size={16} />, label: "Functions" },
      { view: "triggers", icon: <TriggerIcon size={16} />, label: "Triggers" },
      { view: "enums", icon: <EnumIcon size={16} />, label: "Enumerated Types" },
      { view: "extensions", icon: <ExtensionIcon size={16} />, label: "Extensions" },
      { view: "indexes", icon: <IndexIcon size={16} />, label: "Indexes" },
      { view: "publications", icon: <PublicationIcon size={16} />, label: "Publications" },
    ],
  },
  {
    label: "Configuration",
    storageKey: "nav-config-open",
    items: [
      { view: "roles", icon: <RoleIcon size={16} />, label: "Roles" },
      { view: "policies", icon: <PolicyIcon size={16} />, label: "Policies" },
      { view: "settings", icon: <SettingsIcon size={16} />, label: "Settings" },
    ],
  },
  {
    label: "Platform",
    storageKey: "nav-platform-open",
    items: [
      { view: "replication", icon: <ReplicationIcon size={16} />, label: "Replication" },
      { view: "wrappers", icon: <WrapperIcon size={16} />, label: "Wrappers" },
    ],
  },
  {
    label: "Tools",
    storageKey: "nav-tools-open",
    items: [
      { view: "security-advisor", icon: <SecurityIcon size={16} />, label: "Security Advisor" },
      { view: "performance-advisor", icon: <PerformanceIcon size={16} />, label: "Performance Advisor" },
      { view: "query-performance", icon: <QueryStatsIcon size={16} />, label: "Query Performance" },
    ],
  },
];

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

  const handleConnectionClick = useCallback(
    async (id: string, url: string) => {
      if (id === activeConnectionId) {
        setEditingId(id);
        setConnOpen(true);
      } else {
        setStatus("connecting");
        const result = await testConnection(url);
        if (result.ok) {
          setActiveConnection(id, url);
          setStatus("connected");
          toast.success(`Connected to ${result.database}`);
        } else {
          setStatus("error");
          toast.error(result.error ?? "Connection failed");
        }
      }
    },
    [activeConnectionId, setActiveConnection, setStatus]
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

      {/* Connection Section */}
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
            <ConnectionIcon size={14} className="shrink-0" />
            <span className="text-[13px]">Add connection…</span>
          </button>
        ) : (
          <div className="flex flex-col gap-0.5">
            {connections.map((c) => {
              const isActive = c.id === activeConnectionId;
              const isConnected = isActive && status === "connected";
              return (
                <button
                  key={c.id}
                  onClick={() => handleConnectionClick(c.id, c.url)}
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
                    <ConnectionIcon size={14} />
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

      {/* SQL Editor nav item */}
      <div className="px-2 mb-1">
        <NavItem
          icon={<QueryIcon size={16} />}
          label="SQL Editor"
          active={activeView === "queries"}
          onClick={() => onViewChange("queries")}
        />
      </div>

      <div className="border-t border-[var(--border)] mx-3 my-1" />

      {/* Scrollable navigation sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
        {NAV_SECTIONS.map((section) => (
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
        ))}
      </div>

      <ConnectionManager
        open={connOpen}
        onClose={() => setConnOpen(false)}
        editingId={editingId}
      />
    </div>
  );
}
