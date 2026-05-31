import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { IssueCard } from './IssueCard'
import type { Issue, IssueStatus } from '@/types'

// =============================================================================
// PROPS
// =============================================================================

interface BoardColumnProps {
  status:      IssueStatus
  issues:      Issue[]
  projectKey:  string
  onAddIssue:  (statusId: string) => void
  onCardClick: (issueId: string) => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BoardColumn({
  status,
  issues,
  projectKey,
  onAddIssue,
  onCardClick,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id })

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-xl">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: status.color }}
        />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {status.name}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {issues.length}
        </span>
      </div>

      {/* Drop zone + card list */}
      <div
        ref={setNodeRef}
        className={[
          'flex flex-col gap-2 flex-1 overflow-y-auto px-2 py-2 min-h-[120px] max-h-[calc(100vh-200px)] rounded-b-xl transition-colors duration-150',
          isOver ? 'bg-brand-primary/5' : 'bg-transparent',
        ].join(' ')}
      >
        {issues.length === 0 ? (
          <div className="flex-1 flex items-center justify-center m-1">
            <div className={[
              'w-full border border-dashed rounded-lg py-6 flex items-center justify-center transition-colors duration-150',
              isOver ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-border/60',
            ].join(' ')}>
              <span className="text-xs text-muted-foreground/60">No issues</span>
            </div>
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              projectKey={projectKey}
              onClick={onCardClick}
            />
          ))
        )}
      </div>

      {/* Add issue button */}
      <div className="px-2 py-2">
        <button
          type="button"
          onClick={() => onAddIssue(status.id)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Plus size={13} />
          Add issue
        </button>
      </div>
    </div>
  )
}
