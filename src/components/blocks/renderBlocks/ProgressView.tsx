import { Progress } from '@/components/ui/progress'
import type { ProgressBlock } from '@/types/renderBlocks'

interface ProgressViewProps {
  block: ProgressBlock
}

// Usage: render sprint/epic progress (progress block) as a labelled bar.
//   <ProgressView block={block} />
export function ProgressView({ block }: ProgressViewProps) {
  const pct = block.total > 0 ? Math.round((block.completed / block.total) * 100) : 0
  const fallbackTitle = block.kind === 'sprint' ? 'Sprint progress' : 'Progress'

  return (
    <div className="my-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{block.title ?? fallbackTitle}</span>
        <span className="tabular-nums text-muted-foreground">
          {block.completed}/{block.total} ({pct}%)
        </span>
      </div>
      <Progress value={pct} />
      {(block.points || block.dueDate) && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {block.points && (
            <span>
              {block.points.done}/{block.points.total} pts
            </span>
          )}
          {block.dueDate && <span>Due {block.dueDate}</span>}
        </div>
      )}
    </div>
  )
}
