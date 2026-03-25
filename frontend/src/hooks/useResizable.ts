import { useRef, useState, useCallback, useEffect } from 'react'

interface UseResizableOptions {
  initialRatio?: number
  minTopPx?: number
  minBottomPx?: number
}

export function useResizable({
  initialRatio = 0.5,
  minTopPx = 80,
  minBottomPx = 80,
}: UseResizableOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState(initialRatio)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const total = rect.height
      const offsetY = e.clientY - rect.top
      const clampedTop = Math.max(minTopPx, Math.min(total - minBottomPx, offsetY))
      setRatio(clampedTop / total)
    }
    const onMouseUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [minTopPx, minBottomPx])

  return { containerRef, ratio, onMouseDown }
}
