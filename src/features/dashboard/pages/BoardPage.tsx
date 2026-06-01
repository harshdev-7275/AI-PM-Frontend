import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Check } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useBoardData } from '@/hooks/useBoardData'
import { useDragScroll } from '@/hooks/useDragScroll'
import { useProjectStore } from '@/store/useProjectStore'
import { BoardLoadingSkeleton } from '@/components/blocks/BoardLoadingSkeleton'
import { BoardColumn } from '../components/BoardColumn'
import { IssueCardContent } from '../components/IssueCard'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { IssueSlideOver } from '../components/IssueSlideOver'
import { Button } from '@/components/ui/button'
import type { Issue, Sprint } from '@/types'

// =============================================================================
// TABS & SKELETON
// =============================================================================

const TABS = ['Board', 'Backlog', 'Timeline', 'List'] as const
type Tab = (typeof TABS)[number]

// =============================================================================
// SPRINT DROPDOWN
// =============================================================================

const STATUS_DOT: Record<string, string> = {
  active:    'bg-blue-500',
  planned:   'bg-muted-foreground/40',
  completed: 'bg-green-500',
}

const STATUS_LABEL: Record<string, string> = {
  active:    'Active',
  planned:   'Planned',
  completed: 'Completed',
}

type FilterValue = 'all' | 'backlog' | string

interface SprintDropdownProps {
  sprints:  Sprint[]
  value:    FilterValue
  onChange: (value: FilterValue) => void
}

function SprintDropdown({ sprints, value, onChange }: SprintDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const selectedSprint = sprints.find((s) => s.id === value)

  const triggerLabel =
    value === 'all'     ? 'All sprints' :
    value === 'backlog' ? 'Backlog' :
    (selectedSprint?.name ?? 'Sprint')

  const activeSprint = sprints.find((s) => s.status === 'active')

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'h-8 flex items-center gap-2 pl-2.5 pr-2 rounded-md border text-sm font-medium transition-colors',
          open || value !== 'all'
            ? 'border-brand-primary/60 bg-brand-primary/5 text-brand-primary'
            : 'border-input bg-background text-foreground hover:bg-muted/40',
        ].join(' ')}
      >
        {value !== 'all' && value !== 'backlog' && selectedSprint && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[selectedSprint.status] ?? 'bg-muted-foreground/40'}`} />
        )}
        {value === 'all' && activeSprint && (
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        )}
        <span>{triggerLabel}</span>
        <ChevronDown size={13} className={`text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-background border border-border rounded-xl shadow-xl z-30 overflow-hidden">
          {/* Header */}
          <div className="px-3 pt-3 pb-2 border-b border-border">
            <p className="text-xs font-semibold text-foreground">Sprints</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Select to filter the board</p>
          </div>

          {/* All / Backlog shortcuts */}
          <div className="px-2 pt-2 flex flex-col gap-0.5">
            {(['all', 'backlog'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false) }}
                className={[
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left',
                  value === opt
                    ? 'bg-brand-primary/10 text-brand-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                ].join(' ')}
              >
                <span>{opt === 'all' ? 'All issues' : 'Backlog only'}</span>
                {value === opt && <Check size={13} />}
              </button>
            ))}
          </div>

          {/* Sprint list */}
          {sprints.length > 0 && (
            <>
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Sprints
              </p>
              <div className="px-2 pb-2 flex flex-col gap-0.5">
                {sprints.map((sprint) => (
                  <button
                    key={sprint.id}
                    type="button"
                    onClick={() => { onChange(sprint.id); setOpen(false) }}
                    className={[
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-left',
                      value === sprint.id
                        ? 'bg-brand-primary/10'
                        : 'hover:bg-muted/60',
                    ].join(' ')}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${STATUS_DOT[sprint.status] ?? 'bg-muted-foreground/40'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${value === sprint.id ? 'text-brand-primary font-medium' : 'text-foreground'}`}>
                        {sprint.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {STATUS_LABEL[sprint.status] ?? sprint.status}
                        {sprint.startDate && sprint.endDate
                          ? ` · ${sprint.startDate.slice(0, 10)} → ${sprint.endDate.slice(0, 10)}`
                          : ''}
                      </p>
                    </div>
                    {value === sprint.id && <Check size={13} className="text-brand-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// BOARD PAGE
// =============================================================================

export default function BoardPage() {
  const navigate   = useNavigate()
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>()

  const { statuses, issues, sprints, isLoading, handleDragEnd, handleCreateIssue } = useBoardData()
  const currentProject = useProjectStore((s) => s.currentProject)

  const [activeTab,       setActiveTab]       = useState<Tab>('Board')
  const [modalOpen,       setModalOpen]       = useState(false)
  const [modalStatusId,   setModalStatusId]   = useState<string>('')
  const [activeIssue,     setActiveIssue]     = useState<Issue | null>(null)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [sprintFilter,    setSprintFilter]    = useState<string>('all')

  const filteredIssues =
    sprintFilter === 'all'    ? issues :
    sprintFilter === 'backlog' ? issues.filter((i) => i.sprintId === null) :
    issues.filter((i) => i.sprintId === sprintFilter)

  const handleCardClick = (issueId: string) => {
    setSelectedIssueId(issueId)
    setIsSlideOverOpen(true)
  }

  const dragScroll = useDragScroll()

  // 8px movement threshold — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const openModal = (statusId: string) => {
    setModalStatusId(statusId)
    setModalOpen(true)
  }

  const onDragStart = (event: DragStartEvent) => {
    const issue = filteredIssues.find((i) => i.id === event.active.id)
    setActiveIssue(issue ?? null)
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveIssue(null)
    const { active, over } = event
    if (!over) return
    void handleDragEnd(active.id as string, over.id as string)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Topbar                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col border-b border-border bg-background shrink-0">
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">
              {currentProject?.name ?? '—'}
            </span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {currentProject?.key ?? ''}
            </span>
            <span className="text-xs text-muted-foreground">· Backlog</span>
          </div>

          <div className="flex items-center gap-2">
            {sprints.length > 0 && (
              <SprintDropdown
                sprints={sprints}
                value={sprintFilter}
                onChange={setSprintFilter}
              />
            )}
            <Button
              onClick={() => openModal(statuses[0]?.id ?? '')}
              disabled={statuses.length === 0}
              className="h-8 px-3 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0"
            >
              <Plus size={14} className="mr-1" />
              Create issue
            </Button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab === 'Backlog') {
                  navigate(`/${slug}/projects/${projectId}/backlog`)
                } else {
                  setActiveTab(tab)
                }
              }}
              className={[
                'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                              */}
      {/* ------------------------------------------------------------------ */}
      {activeTab !== 'Board' ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {activeTab} — Coming soon
        </div>
      ) : isLoading ? (
        <BoardLoadingSkeleton />
      ) : statuses.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">No statuses configured for this project.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div
            ref={dragScroll.ref}
            onMouseDown={dragScroll.onMouseDown}
            onMouseMove={dragScroll.onMouseMove}
            onMouseUp={dragScroll.onMouseUp}
            onMouseLeave={dragScroll.onMouseLeave}
            className="flex-1 overflow-x-auto overflow-y-hidden cursor-grab"
          >
            <div className="flex gap-6 px-6 pt-4 pb-6 h-full">
              {statuses.map((status) => (
                <BoardColumn
                  key={status.id}
                  status={status}
                  projectKey={currentProject?.key ?? ''}
                  issues={filteredIssues.filter((i) => i.statusId === status.id)}
                  onAddIssue={openModal}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          </div>

          {/* Ghost card that follows the cursor — renders at document root, never clipped */}
          <DragOverlay dropAnimation={null}>
            {activeIssue && (
              <IssueCardContent
                issue={activeIssue}
                projectKey={currentProject?.key ?? ''}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Issue slide-over                                                     */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {selectedIssueId && (
          <IssueSlideOver
            key={selectedIssueId}
            issueId={selectedIssueId}
            isOpen={isSlideOverOpen}
            onClose={() => setIsSlideOverOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* Create issue modal                                                   */}
      {/* ------------------------------------------------------------------ */}
      <CreateIssueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultStatusId={modalStatusId}
        statuses={statuses}
        onSubmit={handleCreateIssue}
      />
    </div>
  )
}
