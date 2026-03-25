import { motion } from 'framer-motion'
import { DatabaseIcon, CodeBracketsIcon, TableGridIcon, CheckIcon } from '../icons'

const steps = ['01', '02', '03', '04', '05']

const cards = [
  {
    Icon: DatabaseIcon,
    title: 'Connect',
    desc: 'Paste your connection string or fill in the form. Supports all PostgreSQL connection formats with SSL.',
    badge: 'Any Postgres instance',
  },
  {
    Icon: CodeBracketsIcon,
    title: 'Query',
    desc: 'Write SQL in a Monaco editor with syntax highlighting, autocompletion, and keyboard shortcuts.',
    badge: 'Full SQL support',
  },
  {
    Icon: TableGridIcon,
    title: 'Results',
    desc: 'View results in a sortable table or JSON. Export to CSV or JSON with one click.',
    badge: 'Export anywhere',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function HowItWorks() {
  return (
    <section id="how" className="px-6 py-24 max-w-6xl mx-auto">
      {/* Label */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-px w-8 bg-[var(--border-strong)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--fg-subtle)]">How it works</span>
      </motion.div>

      <motion.h2
        className="font-display text-[36px] md:text-[44px] leading-tight tracking-[-0.5px] mb-10"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        From connect to query in seconds.
      </motion.h2>

      {/* Step indicators */}
      <motion.div
        className="flex items-center gap-0 mb-14 overflow-x-auto pb-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`
              flex items-center justify-center w-9 h-9 rounded-full border text-[11px] font-semibold shrink-0
              ${i === 0
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-bg)]'
                : 'border-[var(--border-mid)] text-[var(--fg-subtle)]'}
            `}>
              {s}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-12 md:w-20 ${i === 0 ? 'bg-[var(--accent-border)]' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        ))}
      </motion.div>

      {/* Cards */}
      <motion.div
        className="grid md:grid-cols-3 gap-5"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {cards.map(({ Icon, title, desc, badge }) => (
          <motion.div
            key={title}
            variants={cardVariants}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 flex flex-col gap-4 hover:border-[var(--border-mid)] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)]">
              <Icon size={22} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--fg)] mb-2">{title}</h3>
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed">{desc}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--success)] mt-auto">
              <CheckIcon size={12} />
              <span>{badge}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
