import { LogoMark, QueryIcon, TableIcon, HistoryIcon, SavedIcon, ExplorerIcon } from '../icons'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Tooltip } from '../ui/Tooltip'
import { Link } from 'react-router-dom'

export type RailView = 'queries' | 'tables' | 'history' | 'saved' | 'explorer'

interface IconRailProps {
  active: RailView
  onChange: (v: RailView) => void
}

const items: { view: RailView; Icon: typeof QueryIcon; label: string }[] = [
  { view: 'queries', Icon: QueryIcon, label: 'Queries' },
  { view: 'explorer', Icon: ExplorerIcon, label: 'Explorer' },
  { view: 'tables', Icon: TableIcon, label: 'Schema' },
  { view: 'history', Icon: HistoryIcon, label: 'History' },
  { view: 'saved', Icon: SavedIcon, label: 'Saved' },
]

export function IconRail({ active, onChange }: IconRailProps) {
  return (
    <div className="flex flex-col items-center w-[52px] shrink-0 bg-[var(--bg-raised)] border-r border-[var(--border)] h-full py-3 gap-1">
      {/* Logo */}
      <Link to="/" className="mb-3">
        <Tooltip content="pgquery home">
          <LogoMark size={26} />
        </Tooltip>
      </Link>

      {/* Nav icons */}
      {items.map(({ view, Icon, label }) => (
        <Tooltip key={view} content={label}>
          <button
            onClick={() => onChange(view)}
            className={`
              w-9 h-9 flex items-center justify-center rounded transition-colors
              ${active === view
                ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                : 'text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--bg-hover)]'}
            `}
            aria-label={label}
          >
            <Icon size={18} />
          </button>
        </Tooltip>
      ))}

      <div className="flex-1" />
      <ThemeToggle />
    </div>
  )
}
