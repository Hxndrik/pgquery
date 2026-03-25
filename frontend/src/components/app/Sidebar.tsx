import { useState } from "react";
import { NavItem } from "./NavItem";
import { ConnectionManager } from "./ConnectionManager";
import { LogoMark, QueryIcon, ExplorerIcon } from "../icons";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useConnectionStore } from "../../stores/connectionStore";

export type SidebarView = "queries" | "explorer";

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [connOpen, setConnOpen] = useState(false);
  const { activeConnectionUrl, activeConnectionId, connections, status } =
    useConnectionStore();

  const activeConnection = connections.find((c) => c.id === activeConnectionId);
  const connectionName =
    activeConnection?.name ??
    (activeConnectionUrl
      ? (activeConnectionUrl.split("@").pop()?.split("/").pop() ?? "Connected")
      : "No connection");

  return (
    <div className="w-[280px] shrink-0 bg-[var(--bg-raised)] border-r border-[var(--border)] h-full flex flex-col">
      <div className="p-4 flex items-center justify-center border-b border-[var(--border)]">
        <LogoMark size={32} />
      </div>

      <button
        onClick={() => setConnOpen(true)}
        className="flex items-center gap-2 mx-3 mt-3 mb-2 px-3 py-2 rounded bg-[var(--bg-card)] border border-[var(--border-mid)] hover:border-[var(--border-strong)] transition-colors text-left"
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            status === "connected"
              ? "bg-[var(--success)]"
              : "bg-[var(--fg-faint)]"
          }`}
        />
        <span className="text-[12px] text-[var(--fg)] font-medium truncate flex-1">
          {connectionName}
        </span>
      </button>

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

      <div className="p-3 border-t border-[var(--border)]">
        <ThemeToggle />
      </div>

      <ConnectionManager open={connOpen} onClose={() => setConnOpen(false)} />
    </div>
  );
}
