interface IconProps {
  size?: number
  className?: string
}

// ── Brand ────────────────────────────────────────────────────

export function LogoMark({ size = 28, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}>
      <rect width="200" height="200" rx="40" fill="#f8fafc"/>
      
      <path d="M60 70C60 58.9543 68.9543 50 80 50H130C141.046 50 150 58.9543 150 70V130C150 141.046 141.046 150 130 150H80C68.9543 150 60 141.046 60 130V70Z" stroke="#336791" strokeWidth="12"/>
      
      <path d="M85 100L105 120L145 80" stroke="#336791" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      
      <rect x="75" y="65" width="15" height="4" rx="2" fill="#336791"/>
      <rect x="95" y="65" width="15" height="4" rx="2" fill="#94a3b8"/>
    </svg>
  )
}

// ── Navigation ───────────────────────────────────────────────

export function QueryIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 7h8M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function TableIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 7h14" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 7v10" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export function HistoryIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 10a7 7 0 1 0 7-7c-2.5 0-4.7 1.3-6 3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 6v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 7v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function SavedIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M5 3h10a1 1 0 0 1 1 1v13l-6-3-6 3V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Actions ──────────────────────────────────────────────────

export function PlayIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M6 4.5l6 3.5-6 3.5V4.5z"/>
    </svg>
  )
}

export function PlusIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function CloseIcon({ size = 14, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M10.5 3.5l-7 7M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function SearchIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function DownloadIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 3v7M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function CopyIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function FormatIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 4h10M3 8h7M3 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 10l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function TrashIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 5h10M6 5V4h4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="4" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export function EditIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M10.5 3l2.5 2.5-7 7H3.5V10l7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

export function CheckIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ChevronIcon({ size = 16, className = '', direction = 'down' }: IconProps & { direction?: 'up' | 'down' | 'right' | 'left' }) {
  const rotate = { down: 0, up: 180, right: -90, left: 90 }[direction]
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ExternalLinkIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M9 3h4v4M13 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 5H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ── Database Management ───────────────────────────────────────

export function FunctionIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M5 3c1 0 1.5.5 1.5 1.5S6 7 7 8c-1 1-1 2.5-.5 3.5s1 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 3c-1 0-1.5.5-1.5 1.5S10 7 9 8c1 1 1 2.5.5 3.5s-1 1.5-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function TriggerIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M9 2L5 9h3l-1 5 4-7H8l1-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function EnumIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="4.5" cy="4.5" r="1.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="4.5" cy="8" r="1.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="4.5" cy="11.5" r="1.25" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7.5 4.5h5M7.5 8h5M7.5 11.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function ExtensionIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M6 3h4v2h3v4h-2v4H5v-4H3V5h3V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

export function IndexIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 13V9M6 13V7M9 13V5M12 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function PublicationIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 9.5a4.24 4.24 0 0 1 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 7a7.07 7.07 0 0 1 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function RoleIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function PolicyIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 2L3 4.5v4c0 3 2.5 5 5 5.5 2.5-.5 5-2.5 5-5.5v-4L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

export function SettingsIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function SecurityIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 2L3 4.5v4c0 3 2.5 5 5 5.5 2.5-.5 5-2.5 5-5.5v-4L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 8l1.5 1.5L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function PerformanceIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 10a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 10l2.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="10" r="1" fill="currentColor"/>
    </svg>
  )
}

export function QueryStatsIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 13V8M6 13V5M9 13V7M12 13V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function SchemaVisualizerIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10.5" y="10.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5.5 4h5M5.5 6l5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function ReplicationIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M13 5.5A5 5 0 0 0 5.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 10.5A5 5 0 0 0 10.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6.5 1L4.5 3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 15l2-2-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function WrapperIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="3" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 7h3M12 5l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ChevronDownIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function RefreshIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M13 8a5 5 0 0 1-8.54 3.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 8a5 5 0 0 1 8.54-3.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 2v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 14v-3H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Landing page illustrations ────────────────────────────────

export function DatabaseIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <ellipse cx="20" cy="12" rx="13" ry="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 12v8c0 2.76 5.82 5 13 5s13-2.24 13-5v-8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 20v8c0 2.76 5.82 5 13 5s13-2.24 13-5v-8" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export function CodeBracketsIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M15 12l-6 8 6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25 12l6 8-6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 9l-4 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function TableGridIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="6" y="6" width="28" height="28" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 14h28" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 22h28M6 30h28" stroke="currentColor" strokeWidth="1" opacity=".5"/>
      <path d="M16 6v28M26 6v28" stroke="currentColor" strokeWidth="1" opacity=".5"/>
    </svg>
  )
}

export function ExplorerIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      {/* Header row */}
      <rect x="3" y="3" width="14" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      {/* Data rows */}
      <path d="M3 9.5h14M3 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Column dividers */}
      <path d="M7.5 9.5v7M12.5 9.5v7" stroke="currentColor" strokeWidth="1" opacity=".5" strokeLinecap="round"/>
      {/* Bottom border */}
      <path d="M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function SparkleIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"/>
    </svg>
  )
}

export function GithubIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.419 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.57 9.57 0 0 1 10 4.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.338 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd"/>
    </svg>
  )
}

export function ConnectionIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="5" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="15" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7.5 10h5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export function SchemaIcon({ size = 16, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <ellipse cx="8" cy="5" rx="5" ry="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3 5v4c0 1.1 2.24 2 5 2s5-.9 5-2V5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3 9v3c0 1.1 2.24 2 5 2s5-.9 5-2V9" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}
