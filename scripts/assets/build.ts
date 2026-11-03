// Regenerates the brand assets from the pixel grids in frontend/src/brand/pixels.ts.
//
//   node scripts/assets/build.ts            (Node 22.18+, runs TypeScript directly)
//
// Writes SVGs directly; renders PNGs (share card, social preview, touch icon,
// README screenshots are separate) with the Playwright that ships with the
// dev environment. Commit the outputs.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { ICONS, TUPLE, TUPLE_HEAD, cells, iconSvg, tupleMarkup, tupleSvg, type IconName } from '../../frontend/src/brand/pixels.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pub = join(root, 'frontend/public')
const docs = join(root, 'docs/assets')
mkdirSync(join(docs, 'icons'), { recursive: true })

const INK = '#16181d'
const PAPER = '#e7e9e2'
const PAPER_2 = '#f3f4ef'
const write = (path: string, data: string | Buffer) => {
  writeFileSync(path, data)
  console.log('wrote', path.replace(root + '/', ''))
}

// ── pixel wordmark: lowercase 5×9 glyphs (x-height rows 2–6, descenders 7–8)
const GLYPHS: Record<string, string[]> = {
  p: ['.....', '.....', '####.', '#...#', '#...#', '#...#', '####.', '#....', '#....'],
  g: ['.....', '.....', '.####', '#...#', '#...#', '#...#', '.####', '....#', '####.'],
  q: ['.....', '.....', '.####', '#...#', '#...#', '#...#', '.####', '....#', '....#'],
  u: ['.....', '.....', '#...#', '#...#', '#...#', '#..##', '.##.#', '.....', '.....'],
  e: ['.....', '.....', '.###.', '#...#', '#####', '#....', '.###.', '.....', '.....'],
  r: ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....', '.....', '.....'],
  y: ['.....', '.....', '#...#', '#...#', '#...#', '#...#', '.####', '....#', '####.'],
}
function wordmark(text: string): string[] {
  const rows = Array.from({ length: 9 }, () => '')
  ;[...text].forEach((ch, i) => {
    GLYPHS[ch].forEach((r, y) => (rows[y] += (i ? '.' : '') + r))
  })
  return rows
}
// ── README banner: all pixels, no fonts, so it renders the same everywhere.
{
  const W = 136
  const H = 34
  const word = wordmark('pgquery')
  const dither = Array.from({ length: W / 2 }, (_, x) => `M${x * 2} ${H - 3}h1v1h-1zM${x * 2 + 1} ${H - 2}h1v1h-1z`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 8}" height="${H * 8}" shape-rendering="crispEdges" role="img" aria-label="pgquery, with Tuple the pixel elephant">
<title>pgquery</title>
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<svg x="8" y="6" width="30" height="20" viewBox="0 0 30 20">${tupleMarkup('dither', { ink: INK, paper: PAPER_2 }, TUPLE, 'bn')}</svg>
<path d="${cells(word, '#')}" fill="${INK}" transform="translate(46 7) scale(2)"/>
<path d="${dither}" fill="${INK}"/>
</svg>`
  write(join(docs, 'banner.svg'), svg)
}

// ── mascot + icons
write(join(docs, 'tuple.svg'), tupleSvg('color', { ink: INK, paper: PAPER_2 }, { scale: 12 }))
write(join(docs, 'tuple-dither.svg'), tupleSvg('dither', { ink: INK, paper: PAPER_2 }, { scale: 12 }))
for (const name of Object.keys(ICONS) as IconName[]) write(join(docs, 'icons', `${name}.svg`), iconSvg(name, INK, 20))

// ── favicon: Tuple's head in color
write(join(pub, 'favicon.svg'), tupleSvg('color', { ink: INK, paper: PAPER_2 }, { grid: TUPLE_HEAD, scale: 2, title: 'pgquery' }))

// ── PNGs via Playwright
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const fontDir = pathToFileURL(join(root, 'frontend/node_modules/@fontsource')).href
const fontVarDir = pathToFileURL(join(root, 'frontend/node_modules/@fontsource-variable')).href
const fonts = `
@font-face { font-family: 'Archivo'; font-weight: 100 900; font-stretch: 62% 125%; src: url(${fontVarDir}/archivo/files/archivo-latin-wdth-normal.woff2) format('woff2'); }
@font-face { font-family: 'Plex'; font-weight: 400; src: url(${fontDir}/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2) format('woff2'); }
@font-face { font-family: 'Plex'; font-weight: 500; src: url(${fontDir}/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2) format('woff2'); }
`

function card(w: number, h: number) {
  const tupleW = Math.round(h * 0.62)
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
* { box-sizing: border-box; margin: 0; }
body { width: ${w}px; height: ${h}px; background: ${INK}; padding: 14px; }
.card { width: 100%; height: 100%; display: grid; grid-template-columns: 1fr ${Math.round(w * 0.39)}px; background: ${PAPER}; color: ${INK}; }
.l { padding: ${h * 0.076}px ${h * 0.083}px; display: flex; flex-direction: column; justify-content: space-between; border-right: 3px solid ${INK}; }
.top { display: flex; justify-content: space-between; font: 500 ${h * 0.029}px Plex; letter-spacing: 0.14em; }
.top span:first-child { color: #2340d9; }
.name { font: 900 ${h * 0.2}px/0.85 Archivo; font-stretch: 125%; letter-spacing: -0.03em; }
.tag { font: 750 ${h * 0.056}px/1.12 Archivo; font-stretch: 110%; text-transform: uppercase; margin-top: ${h * 0.03}px; }
.tag b { background: #ffe94d; padding: 0 8px; font-weight: 750; }
.cmd { font: 400 ${h * 0.031}px Plex; }
.r { background: ${PAPER_2}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }
.cap { font: 400 ${h * 0.025}px Plex; color: #3f433b; }
.cap b { color: ${INK}; font-weight: 500; }
svg { shape-rendering: crispEdges; }
</style></head><body><div class="card">
<div class="l"><div class="top"><span>OPERATOR'S MANUAL</span><span>ED. 1.0</span></div>
<div><div class="name">pgquery</div><div class="tag">A free Postgres studio<br><b>in one container</b></div></div>
<div class="cmd">docker run ghcr.io/hxndrik/pgquery</div></div>
<div class="r"><svg viewBox="0 0 30 20" width="${tupleW}" height="${(tupleW * 2) / 3}">${tupleMarkup('dither', { ink: INK, paper: PAPER_2 }, TUPLE, 'og')}</svg>
<span class="cap"><b>FIG. 1</b> Tuple, the operator</span></div>
</div></body></html>`
}

function touchIcon() {
  return `<!doctype html><html><body style="margin:0;width:180px;height:180px;background:${PAPER};display:grid;place-items:center">
<svg viewBox="0 0 16 16" width="136" height="136" style="shape-rendering:crispEdges">${tupleMarkup('color', { ink: INK, paper: PAPER_2 }, TUPLE_HEAD)}</svg></body></html>`
}

const browser = await chromium.launch()
async function png(html: string, w: number, h: number, out: string) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  // Load from a file so the file:// font URLs are allowed.
  const file = join(mkdtempSync(join(tmpdir(), 'pgquery-assets-')), 'card.html')
  writeFileSync(file, html)
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  write(out, await page.screenshot({ type: 'png' }))
  await page.close()
}
await png(card(1200, 630), 1200, 630, join(pub, 'og-image.png'))
await png(card(1280, 640), 1280, 640, join(docs, 'social-preview.png'))
await png(touchIcon(), 180, 180, join(pub, 'apple-touch-icon.png'))
await browser.close()
