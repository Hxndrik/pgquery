import { Link } from 'react-router-dom'
import { LogoMark, GithubIcon } from '../icons'
import { Button } from '../ui/Button'
import { ThemeToggle } from '../ui/ThemeToggle'

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 h-16 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <LogoMark size={28} />
        <span className="text-[15px] font-semibold tracking-tight text-[var(--fg)]">pgquery</span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <a href="#features" className="text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Features</a>
        <a href="#how" className="text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">How it works</a>
        <a href="#" className="text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors flex items-center gap-1.5">
          <GithubIcon size={14} />
          GitHub
        </a>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link to="/app">
          <Button variant="outline" size="sm" className="rounded-full">
            Open app →
          </Button>
        </Link>
      </div>
    </nav>
  )
}
