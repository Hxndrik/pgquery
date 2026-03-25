interface EmptyStateProps {
  title?: string
  description?: string
  hint?: string
}

export function EmptyState({
  title = 'Run a query to see results',
  description,
  hint = 'Ctrl+Enter',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
      <div className="w-12 h-12 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="3" width="16" height="16" rx="2.5" stroke="var(--fg-faint)" strokeWidth="1.5"/>
          <path d="M7 8h8M7 11h6M7 14h4" stroke="var(--fg-faint)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-[13px] font-medium text-[var(--fg-subtle)]">{title}</p>
      {description && <p className="text-[12px] text-[var(--fg-faint)]">{description}</p>}
      {hint && (
        <kbd className="text-[10px] text-[var(--fg-faint)] bg-[var(--bg-hover)] border border-[var(--border)] px-2 py-1 rounded font-mono">
          {hint}
        </kbd>
      )}
    </div>
  )
}
