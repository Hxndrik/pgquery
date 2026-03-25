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
      className={`
        flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors w-full
        ${active 
          ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium' 
          : 'text-[var(--fg-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]'}
      `}
    >
      <span className={`shrink-0 ${active ? 'text-[var(--accent)]' : 'text-[var(--fg-subtle)]'}`}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}
