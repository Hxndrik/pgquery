import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'solid' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2'

const variants: Record<Variant, string> = {
  solid:
    'bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 active:opacity-80',
  ghost:
    'bg-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]',
  outline:
    'bg-transparent text-[var(--fg)] border border-[var(--border-mid)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px]',
  md: 'px-4 py-2 text-[13px]',
  lg: 'px-5 py-2.5 text-[14px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'solid', size = 'md', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
)
Button.displayName = 'Button'
