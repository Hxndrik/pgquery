// HTML builders for comparison pages: a feature matrix and win/lose verdicts.
// Marks are words (Yes / Partly / No) with a small ink, dither or empty square,
// so they read without color and print well.

export type Mark = 'yes' | 'partly' | 'no'
/** A cell: a mark, a mark with a note, or plain text. */
export type Cell = Mark | [Mark, string] | string

export interface Matrix {
  caption: string
  tools: string[] // first tool is pgquery (highlighted)
  rows: { label: string; cells: Cell[] }[]
  footnote?: string
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const LABEL: Record<Mark, string> = { yes: 'Yes', partly: 'Partly', no: 'No' }
const isMark = (c: unknown): c is Mark => c === 'yes' || c === 'partly' || c === 'no'

function cell(c: Cell): string {
  if (isMark(c)) return `<span class="mk ${c}">${LABEL[c]}</span>`
  if (Array.isArray(c)) return `<span class="mk ${c[0]}">${LABEL[c[0]]}</span><span class="mk-note">${esc(c[1])}</span>`
  return `<span class="mk-text">${esc(c)}</span>`
}

export function matrix(m: Matrix): string {
  const head = m.tools.map((t, i) => `<th scope="col"${i === 0 ? ' class="us"' : ''}>${esc(t)}</th>`).join('')
  const body = m.rows
    .map(
      (r) =>
        `<tr><th scope="row">${esc(r.label)}</th>${r.cells.map((c, i) => `<td${i === 0 ? ' class="us"' : ''}>${cell(c)}</td>`).join('')}</tr>`,
    )
    .join('')
  return `<figure class="matrix-fig">
<p class="scroll-hint" aria-hidden="true">Swipe sideways for the other tools →</p>
<div class="table-scroll"><table class="matrix" style="min-width:${180 + m.tools.length * 125}px"><caption>${esc(m.caption)}</caption><thead><tr><th scope="col"><span class="sr">Feature</span></th>${head}</tr></thead><tbody>${body}</tbody></table></div>
<figcaption class="caption"><span class="mk yes">Yes</span> <span class="mk partly">Partly</span> <span class="mk no">No</span>${m.footnote ? ` · ${esc(m.footnote)}` : ''}</figcaption>
</figure>`
}

export function verdict(wins: string[], losses: string[]): string {
  const list = (xs: string[]) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
  return `<div class="verdict">
<div class="v-win"><h3>Where pgquery wins</h3>${list(wins)}</div>
<div class="v-lose"><h3>Where pgquery loses</h3>${list(losses)}</div>
</div>`
}

/** "Pick X if…" guidance as a definition list. */
export function pick(items: [string, string][]): string {
  return `<dl class="pick">${items.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`
}

/** A two-column "error you see → what to do" table for connection guides. */
export function errors(rows: [string, string][]): string {
  return `<div class="table-scroll"><table class="errors"><thead><tr><th scope="col">If you see</th><th scope="col">Do this</th></tr></thead><tbody>${rows
    .map(([e, f]) => `<tr><td><code>${esc(e)}</code></td><td>${esc(f)}</td></tr>`)
    .join('')}</tbody></table></div>`
}

/** A smaller matrix: some tools (by index, pgquery first) and some rows (by label). */
export function subset(m: Matrix, tools: number[], rows: string[], caption = m.caption): Matrix {
  return {
    ...m,
    caption,
    tools: tools.map((i) => m.tools[i]),
    rows: rows.map((label) => {
      const row = m.rows.find((r) => r.label === label)
      if (!row) throw new Error(`No row "${label}" in matrix "${m.caption}"`)
      return { label, cells: tools.map((i) => row.cells[i]) }
    }),
  }
}
