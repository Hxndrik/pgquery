// Parse the output of EXPLAIN (FORMAT JSON [, ANALYZE]) into a flat list of
// nodes with the numbers the plan view needs.

export interface RawPlanNode {
  'Node Type': string
  Plans?: RawPlanNode[]
  [key: string]: unknown
}

export interface PlanNode {
  id: number
  depth: number
  type: string
  /** "on tracks t", "using plays_track_id_idx" … */
  target: string
  /** Conditions and filters, as Postgres prints them. */
  details: string[]
  estRows: number
  actualRows: number | null
  loops: number
  /** Time (ms, analyze) or cost (plain explain) spent in this node alone. */
  self: number
  /** self / total, 0..1 */
  share: number
  /** actual/estimated rows ratio when off by 10× or more (either way). */
  misestimate: number | null
  slowest: boolean
}

export interface Plan {
  analyzed: boolean
  nodes: PlanNode[]
  planningMs: number | null
  executionMs: number | null
  /** Root total cost (plain explain) or execution time (analyze). */
  total: number
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** EXPLAIN JSON may arrive as a parsed array or as a JSON string. */
export function parsePlan(value: unknown): Plan {
  const doc = typeof value === 'string' ? JSON.parse(value) : value
  const top = Array.isArray(doc) ? doc[0] : doc
  if (!top || typeof top !== 'object' || !('Plan' in top)) {
    throw new Error('This does not look like EXPLAIN (FORMAT JSON) output.')
  }
  const root = (top as { Plan: RawPlanNode }).Plan
  const analyzed = num(root['Actual Total Time']) !== null
  const nodes: PlanNode[] = []

  const inclusive = (n: RawPlanNode) =>
    analyzed ? (num(n['Actual Total Time']) ?? 0) * (num(n['Actual Loops']) ?? 1) : (num(n['Total Cost']) ?? 0)

  const walk = (n: RawPlanNode, depth: number) => {
    const children = n.Plans ?? []
    const self = Math.max(0, inclusive(n) - children.reduce((sum, c) => sum + inclusive(c), 0))
    const loops = num(n['Actual Loops']) ?? 1
    const estRows = num(n['Plan Rows']) ?? 0
    const actualRows = analyzed ? (num(n['Actual Rows']) ?? 0) : null

    let misestimate: number | null = null
    if (actualRows !== null) {
      const a = Math.max(actualRows, 1)
      const e = Math.max(estRows, 1)
      const ratio = a / e
      if (ratio >= 10 || ratio <= 0.1) misestimate = ratio
    }

    nodes.push({
      id: nodes.length,
      depth,
      type: nodeType(n),
      target: target(n),
      details: details(n),
      estRows,
      actualRows,
      loops,
      self,
      share: 0,
      misestimate,
      slowest: false,
    })
    children.forEach((c) => walk(c, depth + 1))
  }
  walk(root, 0)

  const planningMs = num((top as Record<string, unknown>)['Planning Time'])
  const executionMs = num((top as Record<string, unknown>)['Execution Time'])
  const total = analyzed ? (executionMs ?? inclusive(root)) : inclusive(root)
  const totalSelf = nodes.reduce((s, n) => s + n.self, 0) || 1
  let slowest = nodes[0]
  for (const n of nodes) {
    n.share = n.self / totalSelf
    if (n.self > slowest.self) slowest = n
  }
  if (slowest) slowest.slowest = true

  return { analyzed, nodes, planningMs, executionMs, total }
}

/** "Hash Join (Left)", "Hashed Aggregate", "Seq Scan" … */
function nodeType(n: RawPlanNode): string {
  let t = n['Node Type']
  if (t === 'Aggregate' && n['Strategy']) t = `${n['Strategy']} Aggregate`
  if (n['Join Type'] && n['Join Type'] !== 'Inner') t += ` (${n['Join Type']})`
  return t
}

function target(n: RawPlanNode): string {
  const parts: string[] = []
  const rel = n['Relation Name'] as string | undefined
  const alias = n['Alias'] as string | undefined
  if (rel) parts.push(`on ${rel}${alias && alias !== rel ? ` ${alias}` : ''}`)
  else if (n['CTE Name']) parts.push(`on CTE ${n['CTE Name']}`)
  else if (n['Function Name']) parts.push(`on ${n['Function Name']}()`)
  if (n['Index Name']) parts.push(`using ${n['Index Name']}`)
  return parts.join(' ')
}

const DETAIL_KEYS = ['Index Cond', 'Hash Cond', 'Merge Cond', 'Join Filter', 'Filter', 'Recheck Cond', 'Sort Key', 'Group Key']

function details(n: RawPlanNode): string[] {
  const out: string[] = []
  for (const key of DETAIL_KEYS) {
    const v = n[key]
    if (v == null) continue
    out.push(`${key}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
  }
  const removed = num(n['Rows Removed by Filter'])
  if (removed) out.push(`Rows removed by filter: ${removed.toLocaleString()}`)
  const method = n['Sort Method']
  if (method) out.push(`Sort method: ${method}${n['Sort Space Type'] === 'Disk' ? ' (spilled to disk)' : ''}`)
  return out
}

/** True for statements that EXPLAIN ANALYZE would really execute as writes. */
export function isDataModifying(sql: string): boolean {
  const s = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim().toLowerCase()
  return /^(insert|update|delete|merge|create|drop|alter|truncate|grant|revoke|copy|call|do)\b/.test(s) ||
    (/^with\b/.test(s) && /\b(insert|update|delete|merge)\b/.test(s))
}

export function explainSql(sql: string, analyze: boolean): string {
  const body = sql.trim().replace(/;\s*$/, '')
  return `EXPLAIN (FORMAT JSON${analyze ? ', ANALYZE, BUFFERS' : ''}) ${body}`
}
