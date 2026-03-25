import { motion } from 'framer-motion'

// Hand-crafted SVG illustrations for each feature
function MonacoIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      <rect x="8" y="8" width="40" height="4" rx="2" fill="var(--accent)" opacity=".6"/>
      <rect x="8" y="18" width="60" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="8" y="26" width="20" height="3" rx="1.5" fill="var(--success)" opacity=".7"/>
      <rect x="32" y="26" width="32" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="8" y="34" width="48" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="8" y="42" width="16" height="3" rx="1.5" fill="var(--warning)" opacity=".7"/>
      <rect x="28" y="42" width="28" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="8" y="50" width="36" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="8" y="58" width="8" height="3" rx="1.5" fill="var(--accent)" opacity=".4"/>
      {/* Cursor */}
      <rect x="56" y="18" width="1.5" height="12" rx="1" fill="var(--accent)"/>
    </svg>
  )
}

function TabsIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {/* Tab bar */}
      <rect x="0" y="0" width="120" height="24" rx="6" fill="var(--bg-active)"/>
      <rect x="8" y="6" width="28" height="12" rx="4" fill="var(--bg-card)"/>
      <rect x="40" y="6" width="28" height="12" rx="4" fill="transparent"/>
      <rect x="72" y="6" width="28" height="12" rx="4" fill="transparent"/>
      {/* Tab text */}
      <rect x="12" y="10" width="14" height="3" rx="1.5" fill="var(--fg)"/>
      <rect x="44" y="10" width="14" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="76" y="10" width="14" height="3" rx="1.5" fill="var(--fg-faint)"/>
      {/* Content */}
      <rect x="8" y="32" width="50" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="8" y="40" width="35" height="3" rx="1.5" fill="var(--fg-faint)"/>
    </svg>
  )
}

function SchemaIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {/* Schema tree */}
      <circle cx="16" cy="16" r="5" fill="var(--accent-bg)" stroke="var(--accent-border)" strokeWidth="1"/>
      <rect x="24" y="13" width="40" height="6" rx="3" fill="var(--fg-faint)"/>
      <line x1="16" y1="21" x2="16" y2="32" stroke="var(--border-mid)" strokeWidth="1"/>
      <line x1="16" y1="32" x2="24" y2="32" stroke="var(--border-mid)" strokeWidth="1"/>
      <circle cx="16" cy="32" r="3" fill="var(--bg-active)" stroke="var(--border-mid)" strokeWidth="1"/>
      <rect x="24" y="29" width="32" height="6" rx="3" fill="var(--fg-faint)"/>
      <line x1="16" y1="35" x2="16" y2="46" stroke="var(--border-mid)" strokeWidth="1"/>
      <line x1="16" y1="46" x2="24" y2="46" stroke="var(--border-mid)" strokeWidth="1"/>
      <circle cx="16" cy="46" r="3" fill="var(--bg-active)" stroke="var(--border-mid)" strokeWidth="1"/>
      <rect x="24" y="43" width="44" height="6" rx="3" fill="var(--fg-faint)"/>
      {/* Column details */}
      <rect x="30" y="56" width="20" height="4" rx="2" fill="var(--fg-faint)" opacity=".5"/>
      <rect x="54" y="56" width="16" height="4" rx="2" fill="var(--success)" opacity=".3"/>
    </svg>
  )
}

function DarkLightIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      {/* Dark half */}
      <rect x="0" y="0" width="60" height="80" rx="6" fill="#0c0e14"/>
      <rect x="8" y="12" width="32" height="4" rx="2" fill="rgba(167,139,250,0.5)"/>
      <rect x="8" y="22" width="44" height="3" rx="1.5" fill="rgba(255,255,255,0.1)"/>
      <rect x="8" y="30" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.07)"/>
      <rect x="8" y="38" width="28" height="3" rx="1.5" fill="rgba(255,255,255,0.07)"/>
      {/* Light half */}
      <rect x="60" y="0" width="60" height="80" rx="6" fill="#f5f5f3"/>
      <rect x="68" y="12" width="32" height="4" rx="2" fill="rgba(124,92,191,0.5)"/>
      <rect x="68" y="22" width="44" height="3" rx="1.5" fill="rgba(0,0,0,0.12)"/>
      <rect x="68" y="30" width="36" height="3" rx="1.5" fill="rgba(0,0,0,0.08)"/>
      <rect x="68" y="38" width="28" height="3" rx="1.5" fill="rgba(0,0,0,0.08)"/>
      {/* Divider */}
      <line x1="60" y1="0" x2="60" y2="80" stroke="var(--border-mid)" strokeWidth="1"/>
    </svg>
  )
}

function HistoryIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0, ${i * 16})`}>
          <rect x="8" y="10" width="4" height="4" rx="2" fill="var(--fg-faint)"/>
          <rect x="18" y="10" width="52" height="3" rx="1.5" fill="var(--fg-faint)"/>
          <rect x="18" y="15" width="30" height="2" rx="1" fill="var(--fg-faint)" opacity=".5"/>
          <rect x="90" y="10" width="22" height="4" rx="2" fill={i === 0 ? "var(--success-bg)" : "var(--bg-active)"} stroke={i === 0 ? "var(--success-border)" : "none"}/>
        </g>
      ))}
    </svg>
  )
}

function ExportIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {/* Table */}
      <rect x="8" y="8" width="70" height="52" rx="3" fill="var(--bg-active)"/>
      <rect x="8" y="8" width="70" height="12" rx="3" fill="var(--bg-card)"/>
      <rect x="12" y="12" width="16" height="4" rx="2" fill="var(--fg-subtle)"/>
      <rect x="32" y="12" width="20" height="4" rx="2" fill="var(--fg-subtle)"/>
      {[1,2,3].map(r => (
        <g key={r}>
          <rect x="12" y={8 + r*12 + 6} width="16" height="3" rx="1.5" fill="var(--fg-faint)"/>
          <rect x="32" y={8 + r*12 + 6} width="20" height="3" rx="1.5" fill="var(--fg-faint)"/>
        </g>
      ))}
      {/* Export buttons */}
      <rect x="85" y="20" width="28" height="14" rx="4" fill="var(--accent-bg)" stroke="var(--accent-border)" strokeWidth="1"/>
      <rect x="89" y="26" width="12" height="2" rx="1" fill="var(--accent)"/>
      <rect x="85" y="40" width="28" height="14" rx="4" fill="var(--bg-active)" stroke="var(--border-mid)" strokeWidth="1"/>
      <rect x="89" y="46" width="12" height="2" rx="1" fill="var(--fg-faint)"/>
    </svg>
  )
}

const features = [
  {
    title: 'Monaco Editor with SQL intelligence',
    desc: 'Write SQL in the same editor that powers VS Code. Syntax highlighting, autocompletion from your schema, and keyboard shortcuts.',
    Illustration: MonacoIllustration,
  },
  {
    title: 'Multi-tab queries',
    desc: 'Open multiple queries in parallel tabs. Each tab maintains its own SQL and results. Switch instantly with no re-fetching.',
    Illustration: TabsIllustration,
  },
  {
    title: 'Schema browser',
    desc: 'Explore your database structure. Browse tables, columns, types, and row estimates. Expandable tree with instant search.',
    Illustration: SchemaIllustration,
  },
  {
    title: 'Dark & light mode',
    desc: 'Crafted for both modes. The same premium feel in light as in dark. Persisted to your preferences.',
    Illustration: DarkLightIllustration,
  },
  {
    title: 'Query history & saved queries',
    desc: 'Every query you run is saved. Name and bookmark queries you reuse. All stored locally — never leaves your browser.',
    Illustration: HistoryIllustration,
  },
  {
    title: 'Export anywhere',
    desc: 'Download results as CSV or JSON with one click. Clean files, proper escaping, null handling included.',
    Illustration: ExportIllustration,
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function Features() {
  return (
    <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-px w-8 bg-[var(--border-strong)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--fg-subtle)]">Features</span>
      </motion.div>

      <motion.h2
        className="font-display text-[36px] md:text-[44px] leading-tight tracking-[-0.5px] mb-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Everything you need, nothing you don't.
      </motion.h2>

      <motion.div
        className="grid md:grid-cols-2 gap-5"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {features.map(({ title, desc, Illustration }) => (
          <motion.div
            key={title}
            variants={cardVariants}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 flex flex-col gap-5 hover:border-[var(--border-mid)] transition-colors"
          >
            <div className="rounded-lg overflow-hidden">
              <Illustration />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--fg)] mb-2">{title}</h3>
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
