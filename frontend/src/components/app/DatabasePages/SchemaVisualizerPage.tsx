import { useState, useEffect, useCallback, useRef } from 'react'
import { queryRecords } from '../../../lib/api'
import { listForeignKeyRelationships, listSchemas } from '../../../lib/pgCatalogQueries'
import { useSchemaStore } from '../../../stores/schemaStore'
import { SchemaVisualizerIcon } from '../../icons'
import { SchemaFilter } from './shared'
import { toast } from 'sonner'
import { buildPlateSvg, downloadPlatePng, downloadPlateSvg } from '../../../lib/plate'
import { extractDbName } from '../../../lib/connectionParser'
import { DEMO_URL } from '../../../lib/demo'

interface PageProps { connectionUrl: string }

interface FKRelation {
  source_schema: string
  source_table: string
  source_column: string
  target_schema: string
  target_table: string
  target_column: string
  constraint_name: string
}

interface TableNode {
  schema: string
  name: string
  columns: { name: string; type: string; isPrimary: boolean }[]
  x: number
  y: number
}

const NODE_WIDTH = 200
const NODE_HEADER = 28
const NODE_ROW = 22
const PADDING = 40

// Postgres' long type names don't fit a 200px node; use the familiar aliases.
const TYPE_ALIASES: Record<string, string> = {
  'timestamp with time zone': 'timestamptz',
  'timestamp without time zone': 'timestamp',
  'time with time zone': 'timetz',
  'time without time zone': 'time',
  'double precision': 'float8',
  'character varying': 'varchar',
  'character': 'char',
  'boolean': 'bool',
}
const shortType = (t: string) =>
  TYPE_ALIASES[t] ?? t.replace(/^character varying/, 'varchar').replace(/^timestamp\((\d+)\) with time zone$/, 'timestamptz($1)')

export default function SchemaVisualizerPage({ connectionUrl }: PageProps) {
  const { schema: schemaData } = useSchemaStore()
  const [fks, setFks] = useState<FKRelation[]>([])
  const [schemas, setSchemas] = useState<string[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState<{ nodeId: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null)
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const svgRef = useRef<SVGSVGElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [fkRes, schemaRes] = await Promise.all([
        queryRecords(connectionUrl, listForeignKeyRelationships().query, []),
        queryRecords(connectionUrl, listSchemas().query, []),
      ])
      if (fkRes.success) setFks(fkRes.data as unknown as FKRelation[])
      if (schemaRes.success) {
        const s = schemaRes.data.map(r => String(r.name))
        setSchemas(s)
        if (!selectedSchema && s.length > 0) setSelectedSchema(s.includes('public') ? 'public' : s[0])
      }
    } catch {
      toast.error('Failed to load schema data')
    }
    setLoading(false)
  }, [connectionUrl, selectedSchema])

  useEffect(() => { loadData() }, [loadData])

  // Build nodes from schema data
  const tables: TableNode[] = (() => {
    if (!schemaData) return []
    const schemaObj = schemaData.schemas.find(s => s.name === selectedSchema)
    if (!schemaObj) return []

    // Masonry layout: each table goes into the currently shortest column, so
    // tall tables never overlap the ones below them.
    const cols = 4
    const colY = Array.from({ length: cols }, () => PADDING)
    return schemaObj.tables.map((t) => {
      const saved = nodePositions[`${schemaObj.name}.${t.name}`]
      const col = colY.indexOf(Math.min(...colY))
      const x = PADDING + col * (NODE_WIDTH + 60)
      const y = colY[col]
      colY[col] += NODE_HEADER + t.columns.length * NODE_ROW + 4 + 48
      return {
        schema: schemaObj.name,
        name: t.name,
        columns: t.columns.map(c => ({ name: c.name, type: shortType(c.type), isPrimary: c.isPrimary })),
        x: saved?.x ?? x,
        y: saved?.y ?? y,
      }
    })
  })()

  const filteredFks = fks.filter(fk =>
    fk.source_schema === selectedSchema || fk.target_schema === selectedSchema
  )

  const nodeHeight = (t: TableNode) => NODE_HEADER + t.columns.length * NODE_ROW + 4

  // Find connection points for FK lines
  const getEdgePoints = (source: TableNode, target: TableNode) => {
    const sh = nodeHeight(source)
    const th = nodeHeight(target)
    const sx = source.x + NODE_WIDTH
    const sy = source.y + sh / 2
    const tx = target.x
    const ty = target.y + th / 2
    return { sx, sy, tx, ty }
  }

  const plate = () => {
    const placed = tables.map(t => ({ ...t, ...(nodePositions[`${t.schema}.${t.name}`] ?? {}) }))
    const edges = filteredFks.flatMap(fk => {
      const src = placed.find(t => t.name === fk.source_table && t.schema === fk.source_schema)
      const tgt = placed.find(t => t.name === fk.target_table && t.schema === fk.target_schema)
      return src && tgt ? [getEdgePoints(src, tgt)] : []
    })
    const database = connectionUrl === DEMO_URL ? 'record_store' : extractDbName(connectionUrl).split('?')[0] || 'database'
    return {
      name: `${database}.${selectedSchema}`,
      ...buildPlateSvg({
        database,
        schema: selectedSchema ?? 'public',
        tables: placed.map(t => ({ ...t, width: NODE_WIDTH, height: nodeHeight(t) })),
        edges,
        header: NODE_HEADER,
        row: NODE_ROW,
      }),
    }
  }

  const exportPlate = async (format: 'svg' | 'png') => {
    if (tables.length === 0) return
    const { name, svg, width, height } = plate()
    try {
      if (format === 'svg') downloadPlateSvg(svg, `${name}.plate.svg`)
      else await downloadPlatePng(svg, width, height, `${name}.plate.png`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed')
    }
  }

  const handleMouseDown = (e: React.MouseEvent, tableKey: string, node: TableNode) => {
    e.stopPropagation()
    setDragging({ nodeId: tableKey, startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y })
  }

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'rect') {
      setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / zoom
      const dy = (e.clientY - dragging.startY) / zoom
      setNodePositions(prev => ({
        ...prev,
        [dragging.nodeId]: { x: dragging.nodeX + dx, y: dragging.nodeY + dy },
      }))
    } else if (panning) {
      setPan({
        x: panning.panX + (e.clientX - panning.startX),
        y: panning.panY + (e.clientY - panning.startY),
      })
    }
  }

  const handleMouseUp = () => {
    setDragging(null)
    setPanning(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.min(Math.max(z * delta, 0.2), 3))
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-raised)] shrink-0">
        <SchemaVisualizerIcon size={18} className="text-[var(--fg-subtle)]" />
        <h1 className="text-[14px] font-semibold text-[var(--fg)]">Schema Visualizer</h1>
        <div className="ml-4">
          <SchemaFilter schemas={schemas} selected={selectedSchema} onChange={setSelectedSchema} includeAll={false} />
        </div>
        <div className="ml-auto flex items-center gap-2 text-[12px] text-[var(--fg-muted)]">
          <button onClick={() => setZoom(z => Math.min(z * 1.2, 3))} className="px-2 py-1 rounded hover:bg-[var(--bg-hover)]">+</button>
          <span className="font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(z * 0.8, 0.2))} className="px-2 py-1 rounded hover:bg-[var(--bg-hover)]">-</button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="px-2 py-1 rounded hover:bg-[var(--bg-hover)]">Reset</button>
          <span className="w-px h-5 bg-[var(--border-mid)] mx-1" aria-hidden="true" />
          <span className="label">Export plate</span>
          <button onClick={() => exportPlate('svg')} disabled={tables.length === 0} className="px-2.5 py-1 rounded-sm border border-[var(--border-strong)] text-[var(--fg)] font-semibold hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-40">SVG</button>
          <button onClick={() => exportPlate('png')} disabled={tables.length === 0} className="px-2.5 py-1 rounded-sm border border-[var(--border-strong)] text-[var(--fg)] font-semibold hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-40">PNG</button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[13px] text-[var(--fg-faint)]">Loading schema…</div>
      ) : tables.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[13px] text-[var(--fg-faint)]">
          {selectedSchema ? 'No tables in this schema' : 'Select a schema'}
        </div>
      ) : (
        <svg
          ref={svgRef}
          className="flex-1 cursor-grab active:cursor-grabbing"
          style={{ background: 'var(--bg)' }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* FK relationship lines */}
            {filteredFks.map((fk, i) => {
              const srcNode = tables.find(t => t.name === fk.source_table && t.schema === fk.source_schema)
              const tgtNode = tables.find(t => t.name === fk.target_table && t.schema === fk.target_schema)
              if (!srcNode || !tgtNode) return null
              const { sx, sy, tx, ty } = getEdgePoints(
                { ...srcNode, ...(nodePositions[`${srcNode.schema}.${srcNode.name}`] ?? {}) },
                { ...tgtNode, ...(nodePositions[`${tgtNode.schema}.${tgtNode.name}`] ?? {}) },
              )
              const mx = (sx + tx) / 2
              return (
                <g key={i}>
                  <path
                    d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`}
                    fill="none"
                    stroke="var(--fg)"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                  {/* Target marker */}
                  <rect x={tx - 3.5} y={ty - 3.5} width={7} height={7} fill="var(--fg)" />
                </g>
              )
            })}

            {/* Table nodes */}
            {tables.map(t => {
              const key = `${t.schema}.${t.name}`
              const pos = nodePositions[key] ?? { x: t.x, y: t.y }
              const h = nodeHeight(t)
              return (
                <g
                  key={key}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseDown={(e) => handleMouseDown(e, key, { ...t, ...pos })}
                  style={{ cursor: 'move' }}
                >
                  {/* Card background */}
                  <rect
                    width={NODE_WIDTH}
                    height={h}
                    fill="var(--bg-raised)"
                    stroke="var(--border-strong)"
                    strokeWidth={1.5}
                  />
                  {/* Header */}
                  <rect width={NODE_WIDTH} height={NODE_HEADER} fill="var(--fg)" />
                  <text x={10} y={18} fontSize={12} fontWeight={600} fill="var(--bg)" fontFamily="'IBM Plex Mono', monospace">
                    {t.name}
                  </text>
                  {/* Columns */}
                  {t.columns.map((col, ci) => (
                    <g key={ci} transform={`translate(0, ${NODE_HEADER + ci * NODE_ROW})`}>
                      <text x={10} y={16} fontSize={11} fill={col.isPrimary ? 'var(--accent)' : 'var(--fg)'} fontFamily="'IBM Plex Mono', monospace">
                        {col.isPrimary ? '◆ ' : ''}{col.name}
                      </text>
                      <text x={NODE_WIDTH - 10} y={16} fontSize={10} fill="var(--fg-subtle)" fontFamily="'IBM Plex Mono', monospace" textAnchor="end">
                        {col.type}
                      </text>
                    </g>
                  ))}
                </g>
              )
            })}
          </g>
        </svg>
      )}
    </div>
  )
}
