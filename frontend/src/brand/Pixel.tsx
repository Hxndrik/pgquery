import { useId } from 'react'
import { iconPath, tupleMarkup, TUPLE, type IconName, type TupleStyle } from './pixels'

export function PixelIcon({ name, size = 16, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" className={`pixel ${className}`} aria-hidden="true">
      <path d={iconPath(name)} fill="currentColor" />
    </svg>
  )
}

/** Tuple the elephant. `ink` and `dither` follow the current theme's ink and paper. */
export function Tuple({
  style = 'dither',
  width = 60,
  grid = TUPLE,
  className = '',
  title,
}: {
  style?: TupleStyle
  width?: number
  grid?: string[]
  className?: string
  title?: string
}) {
  const id = useId().replace(/:/g, '')
  const w = grid[0].length
  const h = grid.length
  const markup = tupleMarkup(style, { ink: 'var(--fg)', paper: 'var(--bg-raised)' }, grid, `t${id}`)
  return (
    <svg
      width={width}
      height={(width * h) / w}
      viewBox={`0 0 ${w} ${h}`}
      className={`pixel ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
