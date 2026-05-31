import { useDraggable } from '@dnd-kit/core'
import type { Issue, IssueType, IssuePriority } from '@/types'

// =============================================================================
// CONSTANTS
// =============================================================================

const PRIORITY_COLOR: Record<IssuePriority, string> = {
  critical: 'bg-red-500',
  high:     'bg-amber-400',
  medium:   'bg-blue-400',
  low:      'bg-gray-400',
}

const TYPE_LABEL: Record<IssueType, string> = {
  epic:    'Epic',
  story:   'Story',
  task:    'Task',
  bug:     'Bug',
  feature: 'Feature',
  subtask: 'Subtask',
}

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// =============================================================================
// CARD CONTENT — pure visual, no drag logic
// Rendered both in the column and inside DragOverlay
// =============================================================================

interface IssueCardContentProps {
  issue:         Issue
  projectKey:    string
  assigneeName?: string
  isDragging?:   boolean
}

export function IssueCardContent({
  issue,
  projectKey,
  assigneeName,
  isDragging = false,
}: IssueCardContentProps) {
  const priorityDot = PRIORITY_COLOR[issue.priority as IssuePriority] ?? 'bg-gray-400'
  const typeLabel   = TYPE_LABEL[issue.type as IssueType] ?? issue.type

  return (
    <div
      className={[
        'bg-card border border-border rounded-lg px-3 py-2.5 select-none flex flex-col gap-2 transition-shadow',
        isDragging
          ? 'shadow-2xl ring-2 ring-brand-primary/30 cursor-grabbing'
          : 'hover:border-border/80 hover:shadow-sm cursor-grab',
      ].join(' ')}
    >
      <span className="text-[11px] text-muted-foreground font-mono">
        {projectKey}-{issue.number}
      </span>

      <p className="text-sm text-foreground font-medium leading-snug line-clamp-2">
        {issue.title}
      </p>

      <div className="flex items-center justify-between gap-2 mt-0.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${priorityDot}`}
            title={issue.priority}
          />
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {typeLabel}
          </span>
        </div>

        {assigneeName && (
          <div
            className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[9px] font-semibold shrink-0"
            title={assigneeName}
          >
            {getInitials(assigneeName)}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// ISSUE CARD — draggable wrapper around IssueCardContent
// =============================================================================

interface IssueCardProps {
  issue:         Issue
  projectKey:    string
  assigneeName?: string
  onClick:       (issueId: string) => void
}

export function IssueCard({ issue, projectKey, assigneeName, onClick }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   issue.id,
    data: { statusId: issue.statusId },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0 : 1 }}
      {...listeners}
      {...attributes}
      onClick={() => onClick(issue.id)}
    >
      <IssueCardContent
        issue={issue}
        projectKey={projectKey}
        assigneeName={assigneeName}
      />
    </div>
  )
}
