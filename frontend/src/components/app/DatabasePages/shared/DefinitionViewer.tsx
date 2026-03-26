import { useState } from 'react'
import { CopyIcon, CheckIcon } from '../../../icons'

interface DefinitionViewerProps {
  definition: string
  title?: string
  language?: string
}

export function DefinitionViewer({ definition, title, language }: DefinitionViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(definition)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded border border-[var(--border)] overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-raised)] border-b border-[var(--border)]">
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--fg-subtle)]">
            {title}
            {language && (
              <span className="ml-2 text-[var(--fg-faint)] normal-case tracking-normal">{language}</span>
            )}
          </span>
        </div>
      )}
      <div className="relative group">
        <button
          onClick={handleCopy}
          className="
            absolute top-2 right-2 p-1.5 rounded
            text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--bg-hover)]
            opacity-0 group-hover:opacity-100 transition-all
          "
          title="Copy to clipboard"
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        </button>
        <pre className="p-4 bg-[var(--bg)] text-[13px] font-mono text-[var(--fg)] overflow-auto max-h-[500px] leading-relaxed whitespace-pre-wrap">
          {definition}
        </pre>
      </div>
    </div>
  )
}
