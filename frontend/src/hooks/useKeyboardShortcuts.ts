import { useEffect } from 'react'

interface ShortcutHandlers {
  onRun?: () => void
  onSave?: () => void
  onNewTab?: () => void
  onCloseTab?: () => void
}

export function useKeyboardShortcuts({
  onRun,
  onSave,
  onNewTab,
  onCloseTab,
}: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F5' && onRun) {
        e.preventDefault()
        onRun()
        return
      }

      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      if (e.key === 's' && onSave) {
        e.preventDefault()
        onSave()
      } else if (e.key === 'n' && onNewTab) {
        e.preventDefault()
        onNewTab()
      } else if (e.key === 'w' && onCloseTab) {
        e.preventDefault()
        onCloseTab()
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [onRun, onSave, onNewTab, onCloseTab])
}
