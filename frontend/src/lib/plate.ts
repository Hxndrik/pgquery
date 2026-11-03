// "Plate" export of the schema map: a standalone, printable SVG in the
// manual style (ink on paper, title block, figure number, Tuple).
import { tupleMarkup } from '../brand/pixels'
import { INK, INK_MUTED as MUTED_2, INK_SUBTLE as MUTED, PAPER as PAPER_2, PAPER_RAISED as PAPER } from '../brand/colors'

export interface PlateTable {
  name: string
  columns: { name: string; type: string; isPrimary: boolean }[]
  x: number
  y: number
  width: number
  height: number
}

export interface PlateEdge {
  sx: number
  sy: number
  tx: number
  ty: number
}

export interface PlateInput {
  database: string
  schema: string
  tables: PlateTable[]
  edges: PlateEdge[]
  header: number
  row: number
  date?: Date
}


const SANS = "'Archivo Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
const MONO = "'IBM Plex Mono', 'SFMono-Regular', Menlo, Consolas, monospace"

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildPlateSvg(p: PlateInput): { svg: string; width: number; height: number } {
  const margin = 64
  const minX = Math.min(...p.tables.map((t) => t.x))
  const minY = Math.min(...p.tables.map((t) => t.y))
  const maxX = Math.max(...p.tables.map((t) => t.x + t.width))
  const maxY = Math.max(...p.tables.map((t) => t.y + t.height))
  const drawW = maxX - minX
  const drawH = maxY - minY
  const titleH = 150
  const width = Math.max(drawW + margin * 2, 900)
  const height = drawH + margin * 2 + titleH
  const ox = (width - drawW) / 2 - minX
  const oy = margin - minY

  const edges = p.edges
    .map(({ sx, sy, tx, ty }) => {
      const mx = (sx + tx) / 2
      return `<path d="M${sx + ox} ${sy + oy} C${mx + ox} ${sy + oy}, ${mx + ox} ${ty + oy}, ${tx + ox} ${ty + oy}" fill="none" stroke="${INK}" stroke-width="1.5"/><rect x="${tx + ox - 3.5}" y="${ty + oy - 3.5}" width="7" height="7" fill="${INK}"/>`
    })
    .join('')

  const tables = p.tables
    .map((t) => {
      const cols = t.columns
        .map(
          (c, i) =>
            `<text x="10" y="${p.header + i * p.row + 15}" font-family="${MONO}" font-size="11" fill="${INK}" font-weight="${c.isPrimary ? 600 : 400}">${c.isPrimary ? '◆ ' : ''}${esc(c.name)}</text>` +
            `<text x="${t.width - 10}" y="${p.header + i * p.row + 15}" font-family="${MONO}" font-size="10" fill="${MUTED}" text-anchor="end">${esc(c.type)}</text>`,
        )
        .join('')
      return `<g transform="translate(${t.x + ox} ${t.y + oy})"><rect width="${t.width}" height="${t.height}" fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/><rect width="${t.width}" height="${p.header}" fill="${INK}"/><text x="10" y="18" font-family="${MONO}" font-size="12" font-weight="600" fill="${PAPER}">${esc(t.name)}</text>${cols}</g>`
    })
    .join('')

  const date = (p.date ?? new Date()).toISOString().slice(0, 10)
  const ty = height - titleH
  const tuple = `<svg x="${width - margin - 120}" y="${ty + 30}" width="120" height="80" viewBox="0 0 30 20" shape-rendering="crispEdges">${tupleMarkup('dither', { ink: INK, paper: PAPER_2 }, undefined, 'plate')}</svg>`
  const title =
    `<line x1="12" y1="${ty}" x2="${width - 12}" y2="${ty}" stroke="${INK}" stroke-width="3"/>` +
    `<text x="${margin}" y="${ty + 46}" font-family="${MONO}" font-size="13" letter-spacing="2" fill="${INK}">FIG. 1 · SCHEMA PLATE</text>` +
    `<text x="${margin}" y="${ty + 96}" font-family="${SANS}" font-size="44" font-weight="900" fill="${INK}" letter-spacing="-1">${esc(p.database)}.${esc(p.schema)}</text>` +
    `<text x="${margin}" y="${ty + 126}" font-family="${MONO}" font-size="13" fill="${MUTED_2}">${p.tables.length} tables · ${p.edges.length} foreign keys · ${date} · made with pgquery.dev</text>` +
    tuple

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<title>${esc(p.database)}.${esc(p.schema)} schema</title>` +
    `<rect width="${width}" height="${height}" fill="${PAPER_2}"/>` +
    edges +
    tables +
    title +
    `<rect x="12" y="12" width="${width - 24}" height="${height - 24}" fill="none" stroke="${INK}" stroke-width="3"/>` +
    `</svg>`
  return { svg, width, height }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadPlateSvg(svg: string, filename: string) {
  download(new Blob([svg], { type: 'image/svg+xml' }), filename)
}

export async function downloadPlatePng(svg: string, width: number, height: number, filename: string, scale = 2) {
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not render the PNG')
  download(blob, filename)
}
