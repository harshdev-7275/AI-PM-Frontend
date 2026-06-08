import { cn } from '@/lib/utils'
import type { BreakdownBlock } from '@/types/renderBlocks'

interface BreakdownViewProps {
  block: BreakdownBlock
}

const TONE_BAR: Record<'neutral' | 'good' | 'warn' | 'bad', string> = {
  neutral: 'bg-muted-foreground/40',
  good: 'bg-emerald-500',
  warn: 'bg-amber-500',
  bad: 'bg-red-500',
}

// Usage: render a distribution (breakdown block) as labelled proportion bars.
//   <BreakdownView block={block} />
export function BreakdownView({ block }: BreakdownViewProps) {
  const total = block.total ?? block.segments.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="my-2 space-y-1.5">
      {block.title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {block.title}
        </p>
      )}
      {block.segments.map((seg) => {
        const ratio = seg.ratio ?? (total > 0 ? seg.value / total : 0)
        return (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate text-foreground">{seg.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', TONE_BAR[seg.tone])}
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
              {seg.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
