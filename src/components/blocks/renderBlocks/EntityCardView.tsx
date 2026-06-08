import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EntityCardBlock } from '@/types/renderBlocks'

interface EntityCardViewProps {
  block: EntityCardBlock
}

const STATUS_LABEL: Record<NonNullable<EntityCardBlock['status']>, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
  blocked: 'Blocked',
}

// Usage: render a single issue/sprint summary card (entity_card block).
//   <EntityCardView block={block} />
export function EntityCardView({ block }: EntityCardViewProps) {
  const hasBody = Boolean(block.summary) || block.assignees.length > 0 || block.meta.length > 0

  return (
    <Card className="my-2">
      <CardHeader className="gap-1.5 pb-2">
        <CardTitle className="text-sm">
          <a
            href={block.href}
            className="text-brand-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {block.title}
          </a>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          {block.status && <Badge variant="outline">{STATUS_LABEL[block.status]}</Badge>}
          {block.priority && <Badge variant="secondary">{block.priority}</Badge>}
        </div>
      </CardHeader>
      {hasBody && (
        <CardContent className="space-y-1 pt-0 text-sm text-muted-foreground">
          {block.summary && <p className="leading-relaxed">{block.summary}</p>}
          {block.assignees.length > 0 && (
            <p className="text-xs">{block.assignees.map((a) => a.name).join(', ')}</p>
          )}
          {block.meta.map((m) => (
            <p key={m.label} className="text-xs">
              <span className="font-medium text-foreground">{m.label}:</span> {m.value}
            </p>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
