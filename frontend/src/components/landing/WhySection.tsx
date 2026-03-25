import { motion } from 'framer-motion'

const stats = [
  { value: '$0', label: 'Price', desc: 'Free forever. MIT licensed.' },
  { value: '0 bytes', label: 'Data stored', desc: 'Everything stays in your browser.' },
  { value: '<10s', label: 'Setup time', desc: 'Paste URL. Run query. Done.' },
  { value: 'None', label: 'Dependencies', desc: 'No installs, no extensions.' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function WhySection() {
  return (
    <section className="px-6 py-24 max-w-6xl mx-auto">
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-px w-8 bg-[var(--border-strong)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--fg-subtle)]">Why pgquery</span>
      </motion.div>

      <motion.h2
        className="font-display text-[36px] md:text-[44px] leading-tight tracking-[-0.5px] mb-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Built different, on purpose.
      </motion.h2>

      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {stats.map(({ value, label, desc }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 hover:border-[var(--border-mid)] transition-colors"
          >
            <div className="font-display text-[40px] text-[var(--accent)] leading-none mb-3 tracking-tight">
              {value}
            </div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[var(--fg-subtle)] mb-2">
              {label}
            </div>
            <div className="text-[13px] text-[var(--fg-muted)] leading-relaxed">{desc}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
