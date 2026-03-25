import { useSettingsStore } from '../../stores/settingsStore'
import { Tooltip } from './Tooltip'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useSettingsStore()

  return (
    <Tooltip content={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
      <button
        onClick={toggleTheme}
        className={`
          p-2 rounded text-[var(--fg-subtle)] hover:text-[var(--fg)]
          hover:bg-[var(--bg-hover)] transition-colors
          ${className}
        `}
        aria-label="Toggle theme"
      >
        {/* Half-circle icon */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 1.5A7.5 7.5 0 0 1 9 16.5V1.5z" fill="currentColor"/>
        </svg>
      </button>
    </Tooltip>
  )
}
