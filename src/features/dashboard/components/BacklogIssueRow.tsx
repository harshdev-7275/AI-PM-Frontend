import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Issue, IssueType, IssuePriority, Sprint } from '@/types'

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
// BACKLOG ISSUE ROW
// =============================================================================

interface BacklogIssueRowProps {
  issue:          Issue
  projectKey:     string
  onClick:        (issueId: string) => void
  sprints?:       Sprint[]
  onAddToSprint?: (sprintId: string, issue: Issue) => Promise<void>
  onRemove?:      () => Promise<void>
}

export function BacklogIssueRow({
  issue,
  projectKey,
  onClick,
  sprints,
  onAddToSprint,
  onRemove,
}: BacklogIssueRowProps) {
  const priorityDot = PRIORITY_COLOR[issue.priority as IssuePriority] ?? 'bg-gray-400'
  const typeLabel   = TYPE_LABEL[issue.type as IssueType] ?? issue.type

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isRemoving,   setIsRemoving]   = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const handleAddToSprint = async (sprintId: string) => {
    if (!onAddToSprint) return
    setDropdownOpen(false)
    await onAddToSprint(sprintId, issue)
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onRemove || isRemoving) return
    setIsRemoving(true)
    try { await onRemove() } finally { setIsRemoving(false) }
  }

  const availableSprints = sprints?.filter((s) => s.status !== 'completed') ?? []

  return (
    <div className="group flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
      {/* Issue identifier */}
      <span className="text-[11px] font-mono text-muted-foreground/60 w-16 shrink-0">
        {projectKey}-{issue.number}
      </span>

      {/* Priority dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot}`} title={issue.priority} />

      {/* Title — clickable */}
      <button
        type="button"
        onClick={() => onClick(issue.id)}
        className="flex-1 text-sm text-foreground text-left truncate hover:underline underline-offset-2"
      >
        {issue.title}
      </button>

      {/* Type badge */}
      <Badge variant="secondary" className="h-4 px-1.5 text-[10px] rounded text-muted-foreground/80 shrink-0">
        {typeLabel}
      </Badge>

      {/* Actions — visible on row hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {/* Add to sprint dropdown */}
        {onAddToSprint && availableSprints.length > 0 && (
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDropdownOpen((o) => !o) }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Add to sprint
              <ChevronDown size={10} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-background border border-border rounded-md shadow-lg z-20 py-1">
                {availableSprints.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void handleAddToSprint(s.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.status === 'active' ? 'bg-blue-500' : 'bg-muted-foreground/40'}`} />
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Remove from sprint */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => void handleRemove(e)}
            disabled={isRemoving}
            className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            title="Remove from sprint"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
