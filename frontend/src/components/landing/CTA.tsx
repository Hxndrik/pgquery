import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'

export function CTA() {
  return (
    <section className="px-6 py-24 max-w-3xl mx-auto">
      <motion.div
        className="bg-[var(--bg-card)] border border-[var(--border-mid)] rounded-lg p-12 flex flex-col items-center text-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-raised) 100%)',
          boxShadow: '0 0 60px rgba(167,139,250,0.06)',
        }}
      >
        <div className="w-12 h-12 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l2 6h6l-5 3.6 1.9 5.9L12 15l-4.9 3.5L9 12.6 4 9h6L12 3z" fill="var(--accent)"/>
          </svg>
        </div>
        <h2 className="font-display text-[36px] tracking-[-0.5px]">Ready to query?</h2>
        <p className="text-[15px] text-[var(--fg-muted)] leading-relaxed max-w-md">
          Connect to any PostgreSQL database and get a full management UI instantly. No setup, no account, no waiting.
        </p>
        <Link to="/app">
          <Button size="lg" variant="solid" className="rounded-full px-8 font-semibold">
            Launch pgquery →
          </Button>
        </Link>
      </motion.div>
    </section>
  )
}
