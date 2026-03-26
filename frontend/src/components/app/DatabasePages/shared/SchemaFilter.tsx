import { ChevronDownIcon } from '../../../icons'

interface SchemaFilterProps {
  schemas: string[]
  selected: string | null
  onChange: (schema: string | null) => void
  includeAll?: boolean
}

export function SchemaFilter({ schemas, selected, onChange, includeAll = true }: SchemaFilterProps) {
  return (
    <div className="relative">
      <select
        value={selected ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="
          appearance-none w-full bg-[var(--bg-card)] border border-[var(--border-mid)]
          rounded text-[13px] text-[var(--fg)] pl-3 pr-8 py-2
          transition-colors cursor-pointer
          hover:border-[var(--border-strong)]
          focus:outline-none focus:border-[var(--accent)]
        "
      >
        {includeAll && <option value="">All schemas</option>}
        {schemas.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none">
        <ChevronDownIcon size={14} />
      </span>
    </div>
  )
}
