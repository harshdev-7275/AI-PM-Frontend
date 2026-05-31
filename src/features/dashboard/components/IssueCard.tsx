import { useRef, useEffect } from 'react'
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
        'bg-card border border-border rounded-md px-2.5 py-2 select-none flex flex-col gap-1 transition-shadow',
        isDragging
          ? 'shadow-2xl ring-2 ring-brand-primary/30 cursor-grabbing'
          : 'hover:border-border/80 hover:shadow-sm cursor-grab',
      ].join(' ')}
    >
      {/* Number + footer row combined */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-muted-foreground/60 font-mono">
          {projectKey}-{issue.number}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot}`}
            title={issue.priority}
          />
          {assigneeName && (
            <div
              className="w-4 h-4 rounded-full bg-brand-primary flex items-center justify-center text-white text-[8px] font-semibold shrink-0"
              title={assigneeName}
            >
              {getInitials(assigneeName)}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-foreground font-medium leading-snug line-clamp-2">
        {issue.title}
      </p>

      <span className="text-[10px] text-muted-foreground/60 bg-muted px-1 py-0.5 rounded w-fit">
        {typeLabel}
      </span>
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   issue.id,
    data: { statusId: issue.statusId },
  })

  // Track whether a drag was activated so the pointer-up click is suppressed.
  // isDragging flips true as soon as the 8px activation threshold is crossed;
  // the subsequent click event fires after isDragging returns to false.
  const didDrag = useRef(false)
  useEffect(() => {
    if (isDragging) didDrag.current = true
  }, [isDragging])

  const handleClick = () => {
    if (didDrag.current) {
      didDrag.current = false
      return
    }
    onClick(issue.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0 : 1 }}
      data-dnd-card
      {...listeners}
      {...attributes}
      onClick={handleClick}
    >
      <IssueCardContent
        issue={issue}
        projectKey={projectKey}
        assigneeName={assigneeName}
      />
    </div>
  )
}
