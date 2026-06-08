import { Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { ActionProposalBlock } from '@/types/renderBlocks'

interface ActionProposalViewProps {
  block: ActionProposalBlock
}

const ACTION_LABEL: Record<ActionProposalBlock['action'], string> = {
  create: 'Create',
  update: 'Update',
  transition: 'Move',
  assign: 'Assign',
  delete: 'Delete',
}

// Usage: render a proposed write (action_proposal block) as a descriptive
// confirm card. The actual Confirm/Cancel buttons stay with ChatConfirmActions
// (driven by the message status) — this block only describes the intent.
//   <ActionProposalView block={block} />
export function ActionProposalView({ block }: ActionProposalViewProps) {
  return (
    <div className="my-2 rounded-lg border border-dashed border-brand-primary/40 bg-brand-primary/5 p-3">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={14} className="text-brand-primary" />
        <Badge variant="outline" className="text-[10px]">
          {ACTION_LABEL[block.action]} {block.entity}
        </Badge>
      </div>
      <p className="text-sm text-foreground">{block.summary}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Needs your confirmation before it runs.
      </p>
    </div>
  )
}
