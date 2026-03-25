import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-[var(--bg-card)] border border-[var(--border-mid)]
            rounded text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-faint)]
            px-3 py-2 transition-colors
            hover:border-[var(--border-strong)]
            focus:outline-none focus:border-[var(--accent)]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-raised)]
            ${icon ? 'pl-9' : ''}
            ${error ? 'border-[var(--error)] focus:border-[var(--error)]' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
