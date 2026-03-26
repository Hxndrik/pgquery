import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { GithubIcon } from "../icons";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(167,139,250,0.12) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 max-w-3xl"
      >
        {/* Headline */}
        <motion.h1
          className="font-display text-[48px] md:text-[64px] leading-[1.08] tracking-[-1px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Your database,{" "}
          <span className="text-[var(--fg-muted)] italic">your way.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-[18px] text-[var(--fg-muted)] leading-[1.7] max-w-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          A modern PostgreSQL database explorer that runs in your browser.
          Manage tables, functions, roles, indexes, and more — no accounts, no backend, no nonsense.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex items-center gap-4 flex-wrap justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link to="/app">
            <Button
              size="lg"
              variant="solid"
              className="rounded-full px-7 font-semibold"
            >
              Launch pgquery
            </Button>
          </Link>
          <a
            href="https://github.com/Hxndrik/pgquery"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-6 gap-2"
            >
              <GithubIcon size={16} />
              View on GitHub
            </Button>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
