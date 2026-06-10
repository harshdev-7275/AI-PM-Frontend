import { useDroppable } from '@dnd-kit/core'
import { Plus, FolderOpen, Copy } from 'lucide-react'
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
import type { Category, Issue, IssueStatus } from '@/types'

// Usage:
//   <BoardSwimlane category={cat} statuses={statuses} issues={catIssues} … />
// One horizontal lane of the category swimlane board: a sticky category cell
// on the left, then one droppable cell per status. Dropping a card on a cell
// moves it to that cell's status AND category — dragging across lanes
// re-categorises the issue (which also re-inherits the new category's sprint).

// =============================================================================
// LANE CELL — one (category × status) drop target
// =============================================================================

interface LaneCellProps {
  category:    Category
  status:      IssueStatus
  issues:      Issue[]
  projectKey:  string
  onAddIssue:  (statusId: string, categoryId: string) => void
  onCardClick: (issueId: string) => void
}

function LaneCell({ category, status, issues, projectKey, onAddIssue, onCardClick }: LaneCellProps) {
  // Composite id keeps drop targets unique per lane; the drag handler reads
  // status + category from `data` — dropping on a cell can change the issue's
  // status (column), category (lane), or both
  const { setNodeRef, isOver } = useDroppable({
    id:   `${category.id}::${status.id}`,
    data: { statusId: status.id, categoryId: category.id },
  })

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-testid={`cell-${category.id}-${status.id}`}
          className="w-56 shrink-0 px-1 py-1.5 flex flex-col border-r border-border"
        >
          <div
            ref={setNodeRef}
            className={[
              'flex flex-col gap-2 flex-1 rounded-lg p-1 transition-colors duration-150',
              isOver ? 'bg-brand-primary/5' : 'bg-transparent',
            ].join(' ')}
          >
            {issues.length === 0 ? (
              <div className={[
                'flex-1 min-h-[72px] border border-dashed rounded-lg flex items-center justify-center transition-colors duration-150',
                isOver ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-border',
              ].join(' ')}>
                <span className="text-[11px] text-muted-foreground/40">—</span>
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

          <button
            type="button"
            onClick={() => onAddIssue(status.id, category.id)}
            className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-muted-foreground/0 hover:text-foreground hover:bg-muted transition-colors group-hover/lane:text-muted-foreground/60"
            aria-label={`Add issue to ${category.name} / ${status.name}`}
          >
            <Plus size={11} />
            Add
          </button>
        </div>
      </ContextMenuTrigger>

      {/* Right-click menu — same actions the old column menu offered */}
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => onAddIssue(status.id, category.id)}>
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
      </ContextMenuContent>
    </ContextMenu>
  )
}

// =============================================================================
// SWIMLANE — one category row spanning all status columns
// =============================================================================

interface BoardSwimlaneProps {
  category:    Category
  statuses:    IssueStatus[]
  /** Issues already filtered to this category (and the active sprint filter) */
  issues:      Issue[]
  projectKey:  string
  onAddIssue:  (statusId: string, categoryId: string) => void
  onCardClick: (issueId: string) => void
}

export function BoardSwimlane({
  category,
  statuses,
  issues,
  projectKey,
  onAddIssue,
  onCardClick,
}: BoardSwimlaneProps) {
  return (
    <div
      data-testid={`lane-${category.id}`}
      className="flex border-t border-border group/lane"
    >
      {/* Category cell — sticky so it stays visible while scrolling columns */}
      <div className="w-40 shrink-0 sticky left-0 z-10 bg-background px-3 py-3 border-r border-border">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: category.color }}
          />
          <span className="text-sm font-semibold text-foreground truncate" title={category.name}>
            {category.name}
          </span>
        </div>
        <Badge
          variant="secondary"
          className="mt-1.5 h-4 px-1.5 text-[11px] min-w-[20px] justify-center bg-muted/80 text-muted-foreground"
        >
          {issues.length}
        </Badge>
      </div>

      {/* One drop cell per status */}
      {statuses.map((status) => (
        <LaneCell
          key={status.id}
          category={category}
          status={status}
          issues={issues.filter((i) => i.statusId === status.id)}
          projectKey={projectKey}
          onAddIssue={onAddIssue}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  )
}
