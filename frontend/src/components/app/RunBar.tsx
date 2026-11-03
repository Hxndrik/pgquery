import { PlayIcon, FormatIcon } from '../icons'
import { Button } from '../ui/Button'

interface RunBarProps {
  onRun: () => void
  onExplain?: (analyze: boolean) => void
  onFormat?: () => void
  isLoading: boolean
  rowCount?: number
  duration?: number
}

export function RunBar({ onRun, onExplain, onFormat, isLoading, rowCount, duration }: RunBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--bg-raised)] border-t border-b border-[var(--border)] shrink-0">
      <Button
        variant="solid"
        size="sm"
        onClick={onRun}
        disabled={isLoading}
        className="gap-1.5"
      >
        {isLoading ? (
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <PlayIcon size={12} />
        )}
        {isLoading ? 'Running…' : 'Run'}
      </Button>

      {onExplain && (
        <>
          <Button variant="outline" size="sm" onClick={() => onExplain(false)} disabled={isLoading} title="Show the query plan without running the query">
            Explain
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onExplain(true)} disabled={isLoading} title="Run the query and show the plan with real timings">
            Explain analyze
          </Button>
        </>
      )}

      {onFormat && (
        <Button variant="ghost" size="sm" onClick={onFormat} className="gap-1.5">
          <FormatIcon size={12} />
          Format
        </Button>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {rowCount !== undefined && (
          <span className="font-mono text-[11px] text-[var(--fg-muted)]">
            {rowCount.toLocaleString()} rows
          </span>
        )}
        {duration !== undefined && (
          <span className="font-mono text-[11px] text-[var(--fg-subtle)]">{duration} ms</span>
        )}
        <kbd className="text-[10px] text-[var(--fg-subtle)] border border-[var(--border-mid)] px-1.5 py-0.5 rounded-sm font-mono">
          Ctrl+↵
        </kbd>
      </div>
    </div>
  )
}
