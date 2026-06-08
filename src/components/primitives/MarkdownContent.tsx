import type { ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { CodeBlock } from './CodeBlock'

interface MarkdownContentProps {
  content: string
  className?: string
}

// Usage: render AI-supplied text as safe markdown. Sanitises raw HTML,
// enables GitHub-flavoured markdown (tables, task lists, strikethrough).
// Returns nothing for empty input so the parent bubble can collapse cleanly.
// External links open in a new tab with rel=noopener/noreferrer.
// Fenced code blocks route to <CodeBlock> for proper styling + copy button;
// inline `code` gets a subtle muted background via the `code` override.
//
//   <MarkdownContent content={msg.content} className="..." />
//   <MarkdownContent content="**bold**" />

// Pull the code text and language out of react-markdown's <pre><code>…</code></pre>
// structure. The <code> child carries a className like "language-ts" and the
// raw source as its children (a string or an array including the trailing \n).
function extractCode(children: ReactNode): { code: string; language?: string } {
  const child = Array.isArray(children) ? children[0] : children
  if (
    child &&
    typeof child === 'object' &&
    'props' in child &&
    child.props
  ) {
    const props = child.props as { className?: string; children?: ReactNode }
    const lang = props.className?.match(/language-(\w+)/)?.[1]
    const inner = props.children
    const text =
      typeof inner === 'string'
        ? inner
        : Array.isArray(inner)
          ? inner.filter((c) => typeof c === 'string').join('')
          : ''
    return { code: text, language: lang }
  }
  return { code: '' }
}

// Typography constants — kept here (not in globals.css) so the chat bubble
// is self-contained and easy to retune. Every value uses design-token
// utilities; no raw hex / px values.
const P_CLASS = 'my-2 leading-relaxed first:mt-0 last:mb-0'
const UL_CLASS =
  'my-2 pl-6 list-disc space-y-1 leading-relaxed marker:text-muted-foreground'
const OL_CLASS =
  'my-2 pl-6 list-decimal space-y-1 leading-relaxed marker:text-muted-foreground'
const LI_CLASS = 'leading-relaxed'
const HEADING_BASE =
  'font-semibold text-foreground mt-3 mb-1 first:mt-0 last:mb-0'
const H1_CLASS = `${HEADING_BASE} text-base`
const H2_CLASS = `${HEADING_BASE} text-sm`
const H3_CLASS = `${HEADING_BASE} text-sm`
const H4_CLASS = `${HEADING_BASE} text-xs uppercase tracking-wider text-muted-foreground`
const BQ_CLASS =
  'my-2 border-l-2 border-border pl-3 text-muted-foreground italic'
const CODE_INLINE_CLASS =
  'bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs'
const LINK_CLASS =
  'text-brand-primary underline underline-offset-2 hover:text-brand-primary/80'

const components: Components = {
  p: ({ children }) => <p className={P_CLASS}>{children}</p>,
  ul: ({ children }) => <ul className={UL_CLASS}>{children}</ul>,
  ol: ({ children }) => <ol className={OL_CLASS}>{children}</ol>,
  li: ({ children }) => <li className={LI_CLASS}>{children}</li>,
  h1: ({ children }) => <h1 className={H1_CLASS}>{children}</h1>,
  h2: ({ children }) => <h2 className={H2_CLASS}>{children}</h2>,
  h3: ({ children }) => <h3 className={H3_CLASS}>{children}</h3>,
  h4: ({ children }) => <h4 className={H4_CLASS}>{children}</h4>,
  blockquote: ({ children }) => (
    <blockquote className={BQ_CLASS}>{children}</blockquote>
  ),
  a: ({ children, ...props }) => (
    <a
      {...props}
      className={LINK_CLASS}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    // Fenced code blocks are handled by the pre override; this branch only
    // fires for inline `code` (className won't include "language-*").
    if (className?.includes('language-')) {
      return <code className={className}>{children}</code>
    }
    return <code className={CODE_INLINE_CLASS}>{children}</code>
  },
  pre: ({ children }) => {
    const { code, language } = extractCode(children)
    return <CodeBlock code={code} language={language} />
  },
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content.trim()) return null

  return (
    <div className={className}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  )
}
