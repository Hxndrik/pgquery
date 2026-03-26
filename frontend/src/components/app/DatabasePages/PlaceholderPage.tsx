interface PlaceholderPageProps {
  title: string
  description: string
  icon: React.ReactNode
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="flex justify-center mb-3 text-[var(--fg-subtle)]">{icon}</div>
        <h2 className="text-[15px] font-medium text-[var(--fg)] mb-1">{title}</h2>
        <p className="text-[13px] text-[var(--fg-muted)]">{description}</p>
      </div>
    </div>
  )
}
