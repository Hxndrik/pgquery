// Pixel art for pgquery: Tuple the elephant and the 10×10 tool icons.
// Pure TypeScript with no DOM or React, so the app, the static-site build
// plugin and the asset scripts all draw from the same grids.

/** Tuple, 30×20. K outline · B body · D shade/ear · L highlight · W eye · T tusk */
export const TUPLE = [
  '.....................KKK......',
  '...................KKBBBKK....',
  '.......KKKKKKKKKKKKBLBBBBBK...',
  '.....KKBBBBBBBBBKDKBLLBBBBBK..',
  '...KKBLLBBBBBBBKDDDKBBBBBBBBK.',
  '..KBBLLBBBBBBBKDDDDDKBBBWKBBK.',
  '.KBBBLBBBBBBBBKDDDDDKBBBKBBBK.',
  '.KBBBBBBBBBBBBKDDDDDKBBBBBBBK.',
  'KKBBBBBBBBBBBBKDDDDDKBBBBBBBK.',
  '.KBBBBBBBBBBBBKDDDDDKBBBBBBK..',
  '.KBBBBBBBBBBBBBKDDDKBBBTBBBK..',
  '.KBBBBBBBBBBBBBBKKKBBBTTBBBK..',
  '..KBBBBBBBBBBBBBBBBBBBKKBBBK..',
  '...KDBBBBBBBBBBBBBBBBK.KBBBK..',
  '...KDDDDDDKKKKKDDDDDDK..KBBBK.',
  '...KDDDBBBK...KDDDBBBK..KBBBK.',
  '...KDDDBBBK...KDDDBBBK..KBBBK.',
  '...KDDDBBBK...KDDDBBBK...KBBBK',
  '...KDDDLLLK...KDDDLLLK....KKK.',
  '....KKKKKK.....KKKKKK.........',
]

/** Tuple's head (ear, eye, tusk, trunk): used for the favicon. 16×16. */
export const TUPLE_HEAD = [
  '.......KKK......',
  '.....KKBBBKK....',
  '....KBLBBBBBK...',
  '..KKBLLBBBBBK...',
  '.KDDKBBBBBBBBK..',
  'KDDDDKBBBWKBBK..',
  'KDDDDKBBBKBBBK..',
  'KDDDDKBBBBBBBK..',
  'KDDDDKBBBBBBBK..',
  'KDDDDKBBBBBBK...',
  '.KDDKBBBTBBBK...',
  '..KKBBBTTBBBK...',
  '....KBBKKBBBK...',
  '.........KBBBK..',
  '.........KBBBK..',
  '..........KKK...',
]

export const ICONS = {
  editor: ['##########', '#........#', '#.##.###.#', '#........#', '#.###.##.#', '#........#', '#.#####..#', '#........#', '##########'],
  table: ['##########', '#..#..#..#', '##########', '#..#..#..#', '##########', '#..#..#..#', '##########'],
  schema: ['###....###', '###....###', '.#......#.', '.##....##.', '..######..', '....##....', '...####...', '...####...'],
  key: ['.###......', '#...#.....', '#...######', '#...#.#.#.', '.###......'],
  roles: ['...####...', '...####...', '...####...', '....##....', '.########.', '#.######.#', '..##..##..', '..##..##..'],
  index: ['##.#######', '..........', '##.#####..', '..........', '##.######.', '..........', '##.###....', '..........', '##.#######'],
  bolt: ['.....###..', '....###...', '...###....', '..######..', '....###...', '...###....', '..##......', '.#........'],
  shield: ['.########.', '#........#', '#...##...#', '#..####..#', '#...##...#', '.#......#.', '..#....#..', '...####...'],
  lens: ['..####....', '.#....#...', '#......#..', '#......#..', '.#....#...', '..####.#..', '.......##.', '........##'],
  join: ['###..###..', '#.#..#.#..', '###..###..', '.#....#...', '.######...', '....#.....', '...###....', '...#.#....', '...###....'],
  plan: ['...####...', '...####...', '....##....', '.########.', '.#......#.', '###....###', '###....###'],
  fn: ['...####...', '..#.......', '..#.......', '.#####....', '..#..#..#.', '..#...##..', '..#...##..', '.#...#..#.'],
  trigger: ['....#.....', '...###....', '..#####...', '....#.....', '....#.....', '.#######..', '.#.....#..', '.#######..'],
  enum: ['#.#######.', '..........', '#.#####...', '..........', '#.######..', '..........', '#.####....'],
  plug: ['..#..#....', '..#..#....', '.######...', '.######...', '..####....', '...##.....', '...##.....', '....###...'],
  gear: ['....##....', '.#.####.#.', '..######..', '.###..###.', '###....###', '.###..###.', '..######..', '.#.####.#.', '....##....'],
  replica: ['#####.....', '#...#.....', '#...######', '#####...#.', '....#...#.', '....#####.'],
  bucket: ['##########', '#........#', '.#......#.', '.#......#.', '..#....#..', '..######..'],
  cube: ['...####...', '.##....##.', '#..####..#', '#...##...#', '#...##...#', '.##.##.##.', '...####...'],
  play: ['.##.......', '.####.....', '.######...', '.########.', '.######...', '.####.....', '.##.......'],
  wand: ['........#.', '.......###', '........#.', '......#...', '.....#....', '....#.....', '...#......', '..#.......', '.#........'],
} satisfies Record<string, string[]>

export type IconName = keyof typeof ICONS

/** SVG path data for every cell of `grid` whose character is in `chars`. */
export function cells(grid: string[], chars: string, offsetY = 0): string {
  let d = ''
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (chars.includes(row[x])) d += `M${x} ${y + offsetY}h1v1h-1z`
    }
  })
  return d
}

/** Icon grids are up to 10 tall; center shorter ones vertically. */
export function iconPath(name: IconName): string {
  const grid = ICONS[name]
  return cells(grid, '#', Math.floor((10 - grid.length) / 2))
}

export type TupleStyle = 'color' | 'ink' | 'dither'

export interface Palette {
  ink: string
  paper: string
}

const COLOR = { K: '#16181d', B: '#8fb0f2', D: '#4f6fc0', L: '#d4e2ff', W: '#ffffff', T: '#fff3c4' }

/**
 * Inner SVG markup for Tuple (no <svg> wrapper), in a viewBox of `0 0 w h`.
 * - color: the full-color mascot
 * - ink:   solid ink silhouette with a paper eye (signage / favicon)
 * - dither: 1-bit, the body in a light dither and the ear/legs in 50%
 */
export function tupleMarkup(style: TupleStyle, p: Palette, grid = TUPLE, idPrefix = 'tp'): string {
  if (style === 'color') {
    return (['D', 'B', 'L', 'T', 'W', 'K'] as const)
      .map((c) => `<path d="${cells(grid, c)}" fill="${COLOR[c]}"/>`)
      .join('')
  }
  if (style === 'ink') {
    return `<path d="${cells(grid, 'KBDLT')}" fill="${p.ink}"/><path d="${cells(grid, 'W')}" fill="${p.paper}"/>`
  }
  const a = `${idPrefix}-d50`
  const b = `${idPrefix}-d25`
  return (
    `<defs>` +
    `<pattern id="${a}" width="0.5" height="0.5" patternUnits="userSpaceOnUse"><rect width="0.5" height="0.5" fill="${p.paper}"/><rect width="0.25" height="0.25" fill="${p.ink}"/><rect x="0.25" y="0.25" width="0.25" height="0.25" fill="${p.ink}"/></pattern>` +
    `<pattern id="${b}" width="0.5" height="0.5" patternUnits="userSpaceOnUse"><rect width="0.5" height="0.5" fill="${p.paper}"/><rect width="0.25" height="0.25" fill="${p.ink}"/></pattern>` +
    `</defs>` +
    `<path d="${cells(grid, 'B')}" fill="url(#${b})"/>` +
    `<path d="${cells(grid, 'D')}" fill="url(#${a})"/>` +
    `<path d="${cells(grid, 'LTW')}" fill="${p.paper}"/>` +
    `<path d="${cells(grid, 'K')}" fill="${p.ink}"/>`
  )
}

/** A complete standalone SVG document of Tuple. */
export function tupleSvg(style: TupleStyle, p: Palette, opts: { scale?: number; grid?: string[]; title?: string } = {}): string {
  const grid = opts.grid ?? TUPLE
  const w = grid[0].length
  const h = grid.length
  const s = opts.scale ?? 1
  const title = opts.title ?? 'Tuple, the pgquery elephant'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * s}" height="${h * s}" shape-rendering="crispEdges" role="img" aria-label="${title}"><title>${title}</title>${tupleMarkup(style, p, grid)}</svg>`
}

/** A complete standalone SVG document of one icon. */
export function iconSvg(name: IconName, color: string, size = 40): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="${size}" height="${size}" shape-rendering="crispEdges"><path d="${iconPath(name)}" fill="${color}"/></svg>`
}
