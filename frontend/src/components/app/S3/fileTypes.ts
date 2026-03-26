export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'text'
  | 'font'
  | 'archive'
  | 'unknown'

const EXT_MAP: Record<string, FileCategory> = {
  // Image
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  svg: 'image', ico: 'image', bmp: 'image', tiff: 'image', tif: 'image', avif: 'image',

  // Video
  mp4: 'video', webm: 'video', mov: 'video', ogv: 'video',

  // Audio
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio',
  m4a: 'audio', wma: 'audio', opus: 'audio',

  // PDF
  pdf: 'pdf',

  // Text / markup / data
  txt: 'text', log: 'text', csv: 'text', tsv: 'text',
  json: 'text', jsonl: 'text', ndjson: 'text',
  xml: 'text', html: 'text', htm: 'text',
  yaml: 'text', yml: 'text', toml: 'text',
  ini: 'text', cfg: 'text', conf: 'text', properties: 'text',
  env: 'text', md: 'text', markdown: 'text', rst: 'text',
  sql: 'text', graphql: 'text', gql: 'text',
  proto: 'text', prisma: 'text',

  // Source code
  js: 'text', mjs: 'text', cjs: 'text',
  ts: 'text', tsx: 'text', jsx: 'text',
  py: 'text', pyi: 'text', pyw: 'text',
  go: 'text', rs: 'text', rb: 'text',
  c: 'text', cpp: 'text', cc: 'text', cxx: 'text',
  h: 'text', hpp: 'text', hxx: 'text',
  java: 'text', kt: 'text', kts: 'text',
  php: 'text', css: 'text', scss: 'text', less: 'text', sass: 'text',
  sh: 'text', bash: 'text', zsh: 'text', fish: 'text',
  ps1: 'text', bat: 'text', cmd: 'text',
  lua: 'text', perl: 'text', pl: 'text', pm: 'text',
  r: 'text', R: 'text',
  scala: 'text', swift: 'text', dart: 'text',
  ex: 'text', exs: 'text', erl: 'text',
  hs: 'text', clj: 'text', cljs: 'text', lisp: 'text', el: 'text',
  vue: 'text', svelte: 'text', astro: 'text',
  zig: 'text', nim: 'text', v: 'text', d: 'text',
  tf: 'text', hcl: 'text',
  cmake: 'text', gradle: 'text',

  // Font
  ttf: 'font', otf: 'font', woff: 'font', woff2: 'font', eot: 'font',

  // Archive
  zip: 'archive', tar: 'archive', gz: 'archive', bz2: 'archive',
  xz: 'archive', '7z': 'archive', rar: 'archive',
  jar: 'archive', war: 'archive',
}

// Special filenames (no extension) that are text
const NAME_MAP: Record<string, FileCategory> = {
  makefile: 'text', dockerfile: 'text', vagrantfile: 'text',
  gemfile: 'text', rakefile: 'text', procfile: 'text',
  jenkinsfile: 'text', brewfile: 'text',
  '.gitignore': 'text', '.gitattributes': 'text',
  '.editorconfig': 'text', '.eslintrc': 'text',
  '.prettierrc': 'text', '.babelrc': 'text',
  '.dockerignore': 'text', '.npmignore': 'text',
  '.env': 'text', '.env.local': 'text', '.env.example': 'text',
  license: 'text', readme: 'text', changelog: 'text',
  'package-lock.json': 'text', 'yarn.lock': 'text', 'pnpm-lock.yaml': 'text',
}

export function getFileCategory(key: string): FileCategory {
  const filename = key.split('/').pop()?.toLowerCase() ?? ''

  // Check full filename first
  if (NAME_MAP[filename]) return NAME_MAP[filename]

  // Check extension
  const dotIdx = filename.lastIndexOf('.')
  if (dotIdx >= 0) {
    const ext = filename.slice(dotIdx + 1)
    if (EXT_MAP[ext]) return EXT_MAP[ext]
  }

  return 'unknown'
}

const MB = 1024 * 1024

// Returns max size for auto-preview (shows preview immediately)
export function getAutoPreviewLimit(category: FileCategory): number {
  switch (category) {
    case 'text': return 1 * MB
    case 'unknown': return 1 * MB
    case 'image': return 20 * MB
    case 'pdf': return 50 * MB
    case 'video': return Infinity
    case 'audio': return Infinity
    default: return 0
  }
}

// Returns max size for manual preview ("Load preview" button)
export function getManualPreviewLimit(category: FileCategory): number {
  switch (category) {
    case 'text': return 10 * MB
    case 'unknown': return 10 * MB
    case 'image': return Infinity
    case 'pdf': return Infinity
    case 'video': return Infinity
    case 'audio': return Infinity
    default: return 0
  }
}

export function canPreview(category: FileCategory): boolean {
  return category !== 'font' && category !== 'archive'
}
