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

function SchemaVisualizerIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {/* Table node 1 */}
      <rect x="8" y="10" width="40" height="30" rx="4" fill="var(--bg-card)" stroke="var(--border-mid)" strokeWidth="1"/>
      <rect x="8" y="10" width="40" height="10" rx="4" fill="var(--accent-bg)"/>
      <rect x="8" y="17" width="40" height="3" fill="var(--accent-bg)"/>
      <rect x="13" y="13" width="20" height="3" rx="1.5" fill="var(--accent)"/>
      <rect x="13" y="25" width="12" height="2" rx="1" fill="var(--fg-faint)"/>
      <rect x="28" y="25" width="16" height="2" rx="1" fill="var(--fg-faint)" opacity=".5"/>
      <rect x="13" y="31" width="10" height="2" rx="1" fill="var(--fg-faint)"/>
      <rect x="28" y="31" width="12" height="2" rx="1" fill="var(--fg-faint)" opacity=".5"/>
      {/* Table node 2 */}
      <rect x="72" y="20" width="40" height="30" rx="4" fill="var(--bg-card)" stroke="var(--border-mid)" strokeWidth="1"/>
      <rect x="72" y="20" width="40" height="10" rx="4" fill="var(--accent-bg)"/>
      <rect x="72" y="27" width="40" height="3" fill="var(--accent-bg)"/>
      <rect x="77" y="23" width="18" height="3" rx="1.5" fill="var(--accent)"/>
      <rect x="77" y="35" width="14" height="2" rx="1" fill="var(--fg-faint)"/>
      <rect x="77" y="41" width="10" height="2" rx="1" fill="var(--fg-faint)"/>
      {/* FK line */}
      <path d="M48 30 C 60 30, 60 35, 72 35" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity=".5"/>
      <circle cx="72" cy="35" r="2.5" fill="var(--accent)" opacity=".5"/>
      {/* Table node 3 */}
      <rect x="72" y="56" width="40" height="18" rx="4" fill="var(--bg-card)" stroke="var(--border-mid)" strokeWidth="1"/>
      <rect x="72" y="56" width="40" height="10" rx="4" fill="var(--accent-bg)"/>
      <rect x="72" y="63" width="40" height="3" fill="var(--accent-bg)"/>
      <rect x="77" y="59" width="22" height="3" rx="1.5" fill="var(--accent)"/>
      {/* FK line 2 */}
      <path d="M48 35 C 55 35, 55 65, 72 65" stroke="var(--fg-subtle)" strokeWidth="1" fill="none" opacity=".4"/>
    </svg>
  )
}

function DatabaseManagementIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {/* Sidebar nav items */}
      <rect x="6" y="6" width="32" height="68" rx="3" fill="var(--bg-active)"/>
      <rect x="10" y="10" width="24" height="4" rx="2" fill="var(--accent)" opacity=".6"/>
      <rect x="10" y="18" width="20" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="10" y="24" width="22" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="10" y="30" width="18" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="10" y="36" width="24" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="10" y="44" width="16" height="2" rx="1" fill="var(--fg-faint)" opacity=".5"/>
      <rect x="10" y="49" width="20" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="10" y="55" width="18" height="3" rx="1.5" fill="var(--fg-faint)"/>
      <rect x="10" y="63" width="14" height="2" rx="1" fill="var(--fg-faint)" opacity=".5"/>
      <rect x="10" y="68" width="22" height="3" rx="1.5" fill="var(--fg-faint)"/>
      {/* Main content - table */}
      <rect x="42" y="6" width="72" height="68" rx="3" fill="var(--bg-card)"/>
      <rect x="42" y="6" width="72" height="10" rx="3" fill="var(--bg-active)"/>
      <rect x="46" y="10" width="20" height="3" rx="1.5" fill="var(--fg-subtle)"/>
      <rect x="70" y="10" width="16" height="3" rx="1.5" fill="var(--fg-subtle)"/>
      <rect x="90" y="10" width="20" height="3" rx="1.5" fill="var(--fg-subtle)"/>
      {[1,2,3,4].map(i => (
        <g key={i}>
          <rect x="46" y={6 + i*12 + 6} width="18" height="2.5" rx="1.25" fill="var(--fg-faint)"/>
          <rect x="70" y={6 + i*12 + 6} width="14" height="2.5" rx="1.25" fill="var(--fg-faint)"/>
          <rect x="90" y={6 + i*12 + 6} width="18" height="2.5" rx="1.25" fill="var(--fg-faint)"/>
        </g>
      ))}
    </svg>
  )
}

function SecurityIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {/* Shield */}
      <path d="M60 12 L40 22 V42 C40 54 48 62 60 66 C72 62 80 54 80 42 V22 L60 12Z" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1.5" opacity=".6"/>
      <path d="M52 38 L57 43 L68 32" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Score bar */}
      <rect x="20" y="72" width="80" height="4" rx="2" fill="var(--bg-active)"/>
      <rect x="20" y="72" width="64" height="4" rx="2" fill="var(--success)" opacity=".6"/>
    </svg>
  )
}

function PerformanceIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {/* Gauge */}
      <path d="M30 55 A 30 30 0 0 1 90 55" stroke="var(--border-mid)" strokeWidth="3" fill="none"/>
      <path d="M30 55 A 30 30 0 0 1 82 32" stroke="var(--success)" strokeWidth="3" fill="none" opacity=".7"/>
      {/* Needle */}
      <line x1="60" y1="55" x2="78" y2="37" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="60" cy="55" r="3" fill="var(--accent)"/>
      {/* Metric cards */}
      <rect x="8" y="64" width="32" height="10" rx="3" fill="var(--success-bg)" stroke="var(--success-border)" strokeWidth=".5"/>
      <rect x="12" y="68" width="14" height="2" rx="1" fill="var(--success)" opacity=".6"/>
      <rect x="44" y="64" width="32" height="10" rx="3" fill="var(--bg-active)" stroke="var(--border-mid)" strokeWidth=".5"/>
      <rect x="48" y="68" width="14" height="2" rx="1" fill="var(--fg-faint)"/>
      <rect x="80" y="64" width="32" height="10" rx="3" fill="var(--bg-active)" stroke="var(--border-mid)" strokeWidth=".5"/>
      <rect x="84" y="68" width="14" height="2" rx="1" fill="var(--fg-faint)"/>
    </svg>
  )
}

function RolesIllustration() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className="w-full opacity-70">
      <rect x="0" y="0" width="120" height="80" rx="6" fill="var(--bg-hover)"/>
      {/* Role badges */}
      {[0, 1, 2].map(i => (
        <g key={i} transform={`translate(0, ${i * 22})`}>
          <circle cx="24" cy="18" r="8" fill="var(--accent-bg)" stroke="var(--accent-border)" strokeWidth="1"/>
          <circle cx="24" cy="16" r="3" fill="var(--accent)" opacity=".5"/>
          <path d="M19 24 C19 21 21 19 24 19 S29 21 29 24" fill="var(--accent)" opacity=".3"/>
          <rect x="38" y="14" width="28" height="3" rx="1.5" fill="var(--fg-faint)"/>
          <rect x="38" y="20" width="40" height="2" rx="1" fill="var(--fg-faint)" opacity=".5"/>
          {/* Attribute badges */}
          <rect x="82" y="13" width="16" height="6" rx="3" fill={i === 0 ? "var(--accent-bg)" : "var(--bg-active)"} stroke={i === 0 ? "var(--accent-border)" : "var(--border-mid)"} strokeWidth=".5"/>
          <rect x="100" y="13" width="12" height="6" rx="3" fill="var(--bg-active)" stroke="var(--border-mid)" strokeWidth=".5"/>
        </g>
      ))}
    </svg>
  )
}

const features = [
  {
    title: 'SQL Editor with Monaco intelligence',
    desc: 'Write SQL in the same editor that powers VS Code. Schema-aware autocompletion, multi-tab queries, history, saved queries, and CSV/JSON export.',
    Illustration: MonacoIllustration,
  },
  {
    title: 'Interactive Schema Visualizer',
    desc: 'See your entire database structure as an ER diagram. Drag tables, pan and zoom, and trace foreign key relationships visually.',
    Illustration: SchemaVisualizerIllustration,
  },
  {
    title: 'Full Database Management',
    desc: 'Manage functions, triggers, enum types, extensions, indexes, and publications. Create, alter, and drop with DDL preview before execution.',
    Illustration: DatabaseManagementIllustration,
  },
  {
    title: 'Security Advisor',
    desc: 'Audit your database security posture. Check RLS status, superuser roles, public schema exposure, SSL, and password encryption with a scored report.',
    Illustration: SecurityIllustration,
  },
  {
    title: 'Performance Advisor',
    desc: 'Identify bottlenecks with cache hit ratio, unused indexes, table bloat, sequential scan analysis, and connection utilization monitoring.',
    Illustration: PerformanceIllustration,
  },
  {
    title: 'Roles, Policies & Configuration',
    desc: 'Manage database roles and permissions, Row Level Security policies, and PostgreSQL settings. Full RBAC and RLS management from the browser.',
    Illustration: RolesIllustration,
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
        A complete database explorer. Zero backend.
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
