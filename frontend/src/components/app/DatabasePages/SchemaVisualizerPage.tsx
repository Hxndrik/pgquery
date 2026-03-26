import { useState, useEffect, useCallback, useRef } from 'react'
import { queryRecords } from '../../../lib/api'
import { listForeignKeyRelationships, listSchemas } from '../../../lib/pgCatalogQueries'
import { useSchemaStore } from '../../../stores/schemaStore'
import { SchemaVisualizerIcon } from '../../icons'
import { SchemaFilter } from './shared'
import { toast } from 'sonner'

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
        if (!selectedSchema && s.length > 0) setSelectedSchema(s[0])
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

    const cols = 4
    return schemaObj.tables.map((t, i) => {
      const saved = nodePositions[`${schemaObj.name}.${t.name}`]
      const col = i % cols
      const row = Math.floor(i / cols)
      return {
        schema: schemaObj.name,
        name: t.name,
        columns: t.columns.map(c => ({ name: c.name, type: c.type, isPrimary: c.isPrimary })),
        x: saved?.x ?? PADDING + col * (NODE_WIDTH + 60),
        y: saved?.y ?? PADDING + row * 200,
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
                    stroke="var(--fg-subtle)"
                    strokeWidth={1.5}
                    opacity={0.5}
                  />
                  {/* Arrow */}
                  <circle cx={tx} cy={ty} r={3} fill="var(--fg-subtle)" opacity={0.5} />
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
                    rx={6}
                    fill="var(--bg-raised)"
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                  {/* Header */}
                  <rect width={NODE_WIDTH} height={NODE_HEADER} rx={6} fill="var(--accent-bg)" />
                  <rect y={NODE_HEADER - 6} width={NODE_WIDTH} height={6} fill="var(--accent-bg)" />
                  <text x={10} y={18} fontSize={12} fontWeight={600} fill="var(--accent)" fontFamily="monospace">
                    {t.name}
                  </text>
                  {/* Columns */}
                  {t.columns.map((col, ci) => (
                    <g key={ci} transform={`translate(0, ${NODE_HEADER + ci * NODE_ROW})`}>
                      <text x={10} y={16} fontSize={11} fill={col.isPrimary ? 'var(--accent)' : 'var(--fg)'} fontFamily="monospace">
                        {col.isPrimary ? '🔑 ' : ''}{col.name}
                      </text>
                      <text x={NODE_WIDTH - 10} y={16} fontSize={10} fill="var(--fg-subtle)" fontFamily="monospace" textAnchor="end">
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
