import { LogoMark, GithubIcon } from '../icons'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-8 py-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoMark size={22} />
          <span className="text-[13px] font-semibold text-[var(--fg)]">pgquery</span>
        </div>
        <div className="flex items-center gap-6 text-[12px] text-[var(--fg-muted)]">
          <span>MIT Licensed</span>
          <span>Made for developers</span>
          <a href="https://github.com/Hxndrik/pgquery" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--fg)] transition-colors flex items-center gap-1.5">
            <GithubIcon size={14} />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
