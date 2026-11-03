import { type ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[var(--overlay)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Card */}
          <motion.div
            className={`relative w-full ${width} bg-[var(--bg-card)] border-[1.5px] border-[var(--border-strong)] rounded-sm shadow-[8px_8px_0_0_var(--fg)]`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-3.5 border-b-[1.5px] border-[var(--border-strong)]">
                <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[var(--fg)] [font-stretch:115%] uppercase">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors p-1 rounded-sm hover:bg-[var(--bg-hover)]"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.5 4.5l-8 8M4.5 4.5l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
