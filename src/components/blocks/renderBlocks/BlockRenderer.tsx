import type { ReactNode } from 'react'

import { CodeBlock } from '@/components/primitives/CodeBlock'
import { MarkdownContent } from '@/components/primitives/MarkdownContent'
import type { Block } from '@/types/renderBlocks'

import { ActionProposalView } from './ActionProposalView'
import { BreakdownView } from './BreakdownView'
import { EntityCardView } from './EntityCardView'
import { HealthReportView } from './HealthReportView'
import { ProgressView } from './ProgressView'
import { RankingTableView } from './RankingTableView'

// The registry: one PM block type -> one renderer. A switch (not a lookup
// map) so TypeScript narrows each block to its exact variant with no casts,
// and adding a block type to the schema without a renderer here becomes a
// compile error at the `satisfies never` guard below. `prose` and `code`
// reuse the existing chat primitives rather than new components.
function renderBlock(block: Block): ReactNode {
  switch (block.type) {
    case 'prose':
      return <MarkdownContent content={block.markdown} />
    case 'code':
      return <CodeBlock code={block.code} language={block.language} />
    case 'entity_card':
      return <EntityCardView block={block} />
    case 'ranking_table':
      return <RankingTableView block={block} />
    case 'action_proposal':
      return <ActionProposalView block={block} />
    case 'breakdown':
      return <BreakdownView block={block} />
    case 'progress':
      return <ProgressView block={block} />
    case 'health_report':
      return <HealthReportView block={block} />
    default:
      // Exhaustiveness guard: a new block type added to the schema fails the
      // build here until it gets a renderer. Unreachable at runtime because
      // parseBlocks only yields known, validated block types.
      block satisfies never
      return null
  }
}

interface BlockRendererProps {
  blocks: Block[]
  className?: string
}

// Usage: render a validated list of PM render-contract blocks.
//   <BlockRenderer blocks={parseBlocks(response.result?.blocks)} />
export function BlockRenderer({ blocks, className }: BlockRendererProps) {
  if (blocks.length === 0) return null

  return (
    <div className={className} data-testid="block-renderer">
      {blocks.map((block, i) => (
        <div key={i} data-block-type={block.type}>
          {renderBlock(block)}
        </div>
      ))}
    </div>
  )
}
