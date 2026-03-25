import { useRef, useState, useCallback, useEffect } from 'react'

interface UseResizableWidthOptions {
  storageKey: string
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
}

export function useResizableWidth({
  storageKey,
  initialWidth = 280,
  minWidth = 200,
  maxWidth = 600,
}: UseResizableWidthOptions) {
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem(storageKey)
    return stored ? Number(stored) : initialWidth
  })
  const dragging = useRef(false)
  const widthRef = useRef(width)
  widthRef.current = width

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX))
      setWidth((prev) => (newWidth === prev ? prev : newWidth))
    }
    const onMouseUp = () => {
      if (dragging.current) {
        localStorage.setItem(storageKey, String(widthRef.current))
        dragging.current = false
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [minWidth, maxWidth, storageKey])

  const reset = useCallback(() => {
    setWidth(initialWidth)
    localStorage.setItem(storageKey, String(initialWidth))
  }, [initialWidth, storageKey])

  return { width, onMouseDown, reset }
}
