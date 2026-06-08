import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

// Usage: render a fenced code block returned by the AI as a scrollable,
// monospace block with a header (language label + copy button).
//
//   <CodeBlock code={code} language={lang} />
//
// Inline `code` (e.g. `let x = 1` in a sentence) is NOT routed here —
// MarkdownContent keeps the default <code> render for that.

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be unavailable (insecure context, denied permission).
      // The button is best-effort — silently no-op rather than throw.
    }
  }

  return (
    <div
      className={cn(
        'my-2 rounded-lg border border-border bg-card text-card-foreground overflow-hidden',
        className,
      )}
    >
      {language && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40">
          <span
            data-testid="code-language"
            className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
          >
            {language}
          </span>
          <button
            type="button"
            onClick={() => void handleCopy()}
            aria-label={copied ? 'Copied' : 'Copy code'}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-3 text-xs font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
