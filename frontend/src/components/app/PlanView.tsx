import type { Plan } from '../../lib/plan'

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: n < 10 ? 2 : 0 })

/** A query plan drawn as an indented tree, with each node's share of the work. */
export function PlanView({ plan }: { plan: Plan }) {
  const unit = plan.analyzed ? 'ms' : 'cost'
  const slowest = plan.nodes.find((n) => n.slowest)
  const misestimates = plan.nodes.filter((n) => n.misestimate !== null).length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 bg-[var(--bg-raised)] border-b border-[var(--border)] shrink-0 font-mono text-[11.5px] text-[var(--fg-muted)]">
        <span className="label text-[var(--fg)]">{plan.analyzed ? 'Explain analyze' : 'Explain'}</span>
        {plan.executionMs !== null && (
          <span>
            execution <b className="text-[var(--fg)]">{fmt(plan.executionMs)} ms</b>
          </span>
        )}
        {plan.planningMs !== null && <span>planning {fmt(plan.planningMs)} ms</span>}
        {!plan.analyzed && (
          <span>
            total cost <b className="text-[var(--fg)]">{fmt(plan.total)}</b>
          </span>
        )}
        <span>{plan.nodes.length} nodes</span>
        {slowest && (
          <span>
            heaviest <span className="mark">{slowest.type}</span> {Math.round(slowest.share * 100)}%
          </span>
        )}
        {misestimates > 0 && <span className="text-[var(--warning)]">{misestimates} row estimate{misestimates > 1 ? 's' : ''} off by 10×+</span>}
      </div>

      <div className="flex-1 overflow-auto">
        <ol className="min-w-[720px]">
          {plan.nodes.map((n) => (
            <li
              key={n.id}
              className={`grid grid-cols-[minmax(0,1fr)_120px_96px_150px] gap-4 items-start px-4 py-2 border-b border-[var(--border)] ${
                n.slowest ? 'bg-[var(--accent-bg)]' : ''
              }`}
            >
              <div className="flex min-w-0" style={{ paddingLeft: n.depth * 20 }}>
                {n.depth > 0 && <span className="shrink-0 w-3 h-3 mt-[3px] mr-2 border-l-[1.5px] border-b-[1.5px] border-[var(--fg-faint)]" aria-hidden="true" />}
                <div className="min-w-0 flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className={`text-[13px] font-bold ${n.slowest ? 'mark' : ''}`}>{n.type}</span>
                    {n.target && <span className="font-mono text-[12px] text-[var(--fg-muted)]">{n.target}</span>}
                  </div>
                  {n.details.map((d) => (
                    <span key={d} className="font-mono text-[11px] text-[var(--fg-subtle)] break-words">
                      {d}
                    </span>
                  ))}
                  {n.misestimate !== null && (
                    <span className="font-mono text-[11px] text-[var(--warning)]">
                      Estimated {fmt(n.estRows)} rows, got {fmt(n.actualRows ?? 0)}. Try ANALYZE on this table.
                    </span>
                  )}
                </div>
              </div>

              <div className="font-mono text-[11.5px] text-right tabular-nums">
                {n.actualRows !== null ? (
                  <>
                    <div className="text-[var(--fg)]">{fmt(n.actualRows)} rows</div>
                    <div className="text-[var(--fg-subtle)]">est. {fmt(n.estRows)}{n.loops > 1 ? ` · ×${fmt(n.loops)}` : ''}</div>
                  </>
                ) : (
                  <div className="text-[var(--fg-muted)]">est. {fmt(n.estRows)} rows</div>
                )}
              </div>

              <div className="font-mono text-[11.5px] text-right tabular-nums text-[var(--fg)]">
                {fmt(n.self)} {unit}
              </div>

              <div className="flex items-center gap-2 pt-[3px]" title={`${Math.round(n.share * 100)}% of the ${plan.analyzed ? 'time' : 'cost'}`}>
                <div className="flex-1 h-[10px] border border-[var(--border-mid)] relative">
                  <div
                    className={`absolute inset-y-0 left-0 ${n.slowest ? 'bg-[var(--accent)] border-r border-[var(--fg)]' : 'dither-50'}`}
                    style={{ width: `${Math.max(n.share * 100, n.share > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="w-9 text-right font-mono text-[11px] tabular-nums text-[var(--fg-muted)]">{Math.round(n.share * 100)}%</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
