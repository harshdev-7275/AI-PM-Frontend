import { useState } from 'react'
import { ChevronRight, Play, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Sprint, Issue, SprintStatus } from '@/types'
import { BacklogIssueRow } from './BacklogIssueRow'

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_BADGE: Record<SprintStatus, string> = {
  planned:   'bg-muted text-muted-foreground',
  active:    'bg-blue-500/10 text-blue-600',
  completed: 'bg-green-500/10 text-green-600',
}

// =============================================================================
// SPRINT PANEL
// =============================================================================

interface SprintPanelProps {
  sprint:            Sprint
  issues:            Issue[]
  projectKey:        string
  onIssueClick:      (issueId: string) => void
  onStartSprint?:    (sprintId: string) => Promise<void>
  onCompleteSprint?: (sprintId: string) => Promise<void>
  onRemoveIssue?:    (sprintId: string, issueId: string) => Promise<void>
}

export function SprintPanel({
  sprint,
  issues,
  projectKey,
  onIssueClick,
  onStartSprint,
  onCompleteSprint,
  onRemoveIssue,
}: SprintPanelProps) {
  const [isOpen,      setIsOpen]      = useState(sprint.status === 'active')
  const [isActioning, setIsActioning] = useState(false)

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onStartSprint || isActioning) return
    setIsActioning(true)
    try { await onStartSprint(sprint.id) } finally { setIsActioning(false) }
  }

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onCompleteSprint || isActioning) return
    setIsActioning(true)
    try { await onCompleteSprint(sprint.id) } finally { setIsActioning(false) }
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <ChevronRight
          size={14}
          className={`text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium text-foreground flex-1 truncate">{sprint.name}</span>

        {sprint.startDate && sprint.endDate && (
          <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
            {sprint.startDate.slice(0, 10)} → {sprint.endDate.slice(0, 10)}
          </span>
        )}

        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize shrink-0 ${STATUS_BADGE[sprint.status]}`}>
          {sprint.status}
        </span>

        <span className="text-[11px] text-muted-foreground shrink-0">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>

        {sprint.status === 'planned' && onStartSprint && (
          <Button
            onClick={handleStart}
            disabled={isActioning}
            className="h-6 px-2 text-[11px] bg-blue-500 hover:bg-blue-600 text-white border-0 shrink-0 gap-1"
          >
            <Play size={10} />
            Start
          </Button>
        )}

        {sprint.status === 'active' && onCompleteSprint && (
          <Button
            onClick={handleComplete}
            disabled={isActioning}
            className="h-6 px-2 text-[11px] bg-green-600 hover:bg-green-700 text-white border-0 shrink-0 gap-1"
          >
            <CheckCheck size={10} />
            Complete
          </Button>
        )}
      </button>

      {/* Issue list */}
      {isOpen && (
        <div>
          {issues.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground text-center">
              No issues in this sprint
            </p>
          ) : (
            issues.map((issue) => (
              <BacklogIssueRow
                key={issue.id}
                issue={issue}
                projectKey={projectKey}
                onClick={onIssueClick}
                onRemove={
                  onRemoveIssue && sprint.status !== 'completed'
                    ? () => onRemoveIssue(sprint.id, issue.id)
                    : undefined
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
