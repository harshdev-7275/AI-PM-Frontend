import { useDroppable } from '@dnd-kit/core'
import { Plus, FolderOpen, Copy, Trash2 } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Badge } from '@/components/ui/badge'
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
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex flex-col w-56 shrink-0">
          {/* Column header */}
          <div className="flex items-center gap-2 px-1 py-2.5 mb-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: status.color }}
            />
            <span className="text-sm font-semibold text-foreground truncate">
              {status.name}
            </span>
            <Badge variant="secondary" className="h-4 px-1.5 text-[11px] min-w-[20px] justify-center bg-muted/80 text-muted-foreground">
              {issues.length}
            </Badge>
          </div>

          {/* Drop zone + card list */}
          <div
            ref={setNodeRef}
            className={[
              'flex flex-col gap-2 flex-1 overflow-y-auto px-1 py-1 max-h-[calc(100vh-240px)] rounded-lg transition-colors duration-150',
              isOver ? 'bg-brand-primary/5' : 'bg-transparent',
            ].join(' ')}
          >
            {issues.length === 0 ? (
              <div className="h-full min-h-[200px] flex items-center justify-center">
                <div className={[
                  'w-full border border-dashed rounded-lg py-10 flex items-center justify-center transition-colors duration-150',
                  isOver ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-border/40',
                ].join(' ')}>
                  <span className="text-xs text-muted-foreground/50">No issues</span>
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

          {/* Add issue — always visible at bottom */}
          <div className="pt-1 pb-1 px-1">
            <button
              type="button"
              onClick={() => onAddIssue(status.id)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus size={12} />
              Add issue
            </button>
          </div>
        </div>
      </ContextMenuTrigger>

      {/* Right-click context menu */}
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => onAddIssue(status.id)}>
          <Plus size={14} className="mr-2" />
          Add issue
          <ContextMenuShortcut>C</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem disabled>
          <FolderOpen size={14} className="mr-2" />
          Open column
        </ContextMenuItem>

        <ContextMenuItem disabled>
          <Copy size={14} className="mr-2" />
          Copy link
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem disabled className="text-destructive focus:text-destructive focus:bg-destructive/10">
          <Trash2 size={14} className="mr-2" />
          Clear column
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
