import { useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
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
import { BoardColumn } from '../components/BoardColumn'
import { IssueCardContent } from '../components/IssueCard'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { IssueSlideOver } from '../components/IssueSlideOver'
import { Button } from '@/components/ui/button'
import type { Issue } from '@/types'

// =============================================================================
// TABS
// =============================================================================

const TABS = ['Board', 'Backlog', 'Timeline', 'List'] as const
type Tab = (typeof TABS)[number]

// =============================================================================
// SKELETON
// =============================================================================

function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-72 shrink-0 rounded-xl bg-muted/50 border border-border/60 p-3 flex flex-col gap-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// BOARD PAGE
// =============================================================================

export default function BoardPage() {
  const { statuses, issues, isLoading, handleDragEnd, handleCreateIssue } = useBoardData()
  const currentProject = useProjectStore((s) => s.currentProject)

  const [activeTab,       setActiveTab]       = useState<Tab>('Board')
  const [modalOpen,       setModalOpen]       = useState(false)
  const [modalStatusId,   setModalStatusId]   = useState<string>('')
  const [activeIssue,     setActiveIssue]     = useState<Issue | null>(null)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)

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
    const issue = issues.find((i) => i.id === event.active.id)
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

          <Button
            onClick={() => openModal(statuses[0]?.id ?? '')}
            disabled={statuses.length === 0}
            className="h-8 px-3 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0"
          >
            <Plus size={14} className="mr-1" />
            Create issue
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
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
        <BoardSkeleton />
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
                  issues={issues.filter((i) => i.statusId === status.id)}
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
