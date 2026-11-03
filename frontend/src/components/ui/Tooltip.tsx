import { type ReactNode, useState } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-[var(--fg)] text-[var(--bg)] font-mono text-[11px] px-2 py-1 rounded-sm whitespace-nowrap">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
