import type { ReactNode } from 'react'

interface NavItemProps {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
}

export function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`
        flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] w-full text-left transition-colors
        ${active
          ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-semibold'
          : 'text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]'}
      `}
    >
      <span className={`shrink-0 flex ${active ? '' : 'text-[var(--fg-subtle)]'}`}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}
