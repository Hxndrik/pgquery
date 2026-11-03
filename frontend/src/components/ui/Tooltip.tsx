import { type ReactNode, useState } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  /** Where the tip opens; use "bottom" near the top edge (the header). */
  side?: 'top' | 'bottom'
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none ${side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          <div className="bg-[var(--fg)] text-[var(--bg)] font-mono text-[11px] px-2 py-1 rounded-sm whitespace-nowrap">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
