// Literal colors for consumers that can't read CSS variables: Monaco's editor
// themes and exported files (schema plates). Keep in step with the tokens in
// src/index.css. Components must use the CSS tokens, never these.

export const INK = '#16181d'
export const INK_MUTED = '#3f433b'
export const INK_SUBTLE = '#5f645a'
export const PAPER = '#e7e9e2'
export const PAPER_RAISED = '#f3f4ef'
export const ACCENT = '#ffe94d' // the one accent: highlighter yellow

export interface EditorPalette {
  background: string
  foreground: string
  lineHighlight: string
  lineNumber: string
  lineNumberActive: string
  selection: string
  selectionInactive: string
  cursor: string
  keyword: string
  fn: string
  operator: string
  string: string
  number: string
  comment: string
}

export const EDITOR_LIGHT: EditorPalette = {
  background: PAPER_RAISED,
  foreground: INK,
  lineHighlight: '#eceee6',
  lineNumber: '#a6aaa0',
  lineNumberActive: INK,
  selection: `${ACCENT}cc`,
  selectionInactive: `${ACCENT}66`,
  cursor: INK,
  keyword: INK, // bold
  fn: '#3f433b', // italic
  operator: INK, // bold for JOIN, AND …
  string: '#11803d',
  number: '#9a5b00',
  comment: '#7d8277',
}

export const EDITOR_DARK: EditorPalette = {
  background: '#17191d',
  foreground: '#eceee7',
  lineHighlight: '#1e2125',
  lineNumber: '#4d5149',
  lineNumberActive: '#c2c5bc',
  selection: `${ACCENT}40`,
  selectionInactive: `${ACCENT}1f`,
  cursor: ACCENT,
  keyword: '#ffffff',
  fn: '#c2c5bc',
  operator: '#ffffff',
  string: '#5fd38a',
  number: '#ffc24d',
  comment: '#7a7e75',
}
