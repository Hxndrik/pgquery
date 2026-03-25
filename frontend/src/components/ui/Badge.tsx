import { type ReactNode } from 'react'

type Variant = 'accent' | 'success' | 'warning' | 'error' | 'neutral'

interface BadgeProps {
  children: ReactNode
  variant?: Variant
  className?: string
}

const variants: Record<Variant, string> = {
  accent:  'bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
  error:   'bg-[var(--error-bg)] text-[var(--error)]',
  neutral: 'bg-[var(--bg-hover)] text-[var(--fg-muted)] border border-[var(--border)]',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5
        text-[10px] font-medium uppercase tracking-[0.5px]
        rounded-full
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  )
}
