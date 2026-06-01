import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useBacklog } from '@/hooks/useBacklog'
import { useProjectStore } from '@/store/useProjectStore'
import { useProject } from '@/hooks/useProject'
import { Button } from '@/components/ui/button'
import { IssueSlideOver } from '../components/IssueSlideOver'
import { SprintPanel } from '../components/SprintPanel'
import { BacklogIssueRow } from '../components/BacklogIssueRow'
import { CreateSprintModal } from '../components/CreateSprintModal'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { SprintSettings } from '../components/SprintSettings'

// =============================================================================
// CONSTANTS
// =============================================================================

const TABS = ['Board', 'Backlog', 'Timeline', 'List'] as const
type Tab = (typeof TABS)[number]

// =============================================================================
// BACKLOG PAGE
// =============================================================================

export default function BacklogPage() {
  const navigate   = useNavigate()
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>()

  const currentProject = useProjectStore((s) => s.currentProject)
  const { updateProject } = useProject()

  const {
    sprints, backlogIssues, statuses, isLoading, isCreatingSprint, allIssues,
    loadBacklog, handleCreateSprint, handleCreateIssue,
    handleStartSprint, handleCompleteSprint,
    handleAddIssueToSprint, handleRemoveIssueFromSprint,
  } = useBacklog(slug ?? '', projectId ?? '')

  useEffect(() => { void loadBacklog() }, [slug, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedIssueId,    setSelectedIssueId]    = useState<string | null>(null)
  const [isSlideOverOpen,    setIsSlideOverOpen]    = useState(false)
  const [isSprintModalOpen,  setIsSprintModalOpen]  = useState(false)
  const [isIssueModalOpen,   setIsIssueModalOpen]   = useState(false)

  const handleIssueClick = (issueId: string) => {
    setSelectedIssueId(issueId)
    setIsSlideOverOpen(true)
  }

  const handleTabClick = (tab: Tab) => {
    if (tab === 'Board') navigate(`/${slug}/projects/${projectId}/board`)
  }

  const projectKey = currentProject?.key ?? ''

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
            onClick={() => setIsSprintModalOpen(true)}
            disabled={isCreatingSprint}
            className="h-8 px-3 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0"
          >
            <Plus size={14} className="mr-1" />
            Create sprint
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={[
                'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                tab === 'Backlog'
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
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {/* Sprint cadence settings */}
          {currentProject && (
            <SprintSettings
              project={currentProject}
              sprintCount={sprints.length}
              onSave={(input) => updateProject(slug ?? '', projectId ?? '', input)}
            />
          )}

          {/* Sprint panels */}
          {sprints.map((sprint) => (
            <SprintPanel
              key={sprint.id}
              sprint={sprint}
              issues={allIssues.filter((i) => i.sprintId === sprint.id)}
              projectKey={projectKey}
              onIssueClick={handleIssueClick}
              onStartSprint={handleStartSprint}
              onCompleteSprint={handleCompleteSprint}
              onRemoveIssue={handleRemoveIssueFromSprint}
            />
          ))}

          {/* Backlog section */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30">
              <span className="text-sm font-medium text-foreground flex-1">
                Backlog ({backlogIssues.length})
              </span>
            </div>

            {backlogIssues.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground text-center">
                No issues in the backlog
              </p>
            ) : (
              backlogIssues.map((issue) => (
                <BacklogIssueRow
                  key={issue.id}
                  issue={issue}
                  projectKey={projectKey}
                  onClick={handleIssueClick}
                  sprints={sprints}
                  onAddToSprint={handleAddIssueToSprint}
                />
              ))
            )}

            {/* Create issue footer */}
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border/50"
            >
              <Plus size={12} />
              Create issue
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Modals & slide-overs                                                 */}
      {/* ------------------------------------------------------------------ */}
      <CreateSprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSubmit={handleCreateSprint}
      />

      <CreateIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        defaultStatusId={statuses[0]?.id ?? ''}
        statuses={statuses}
        onSubmit={async (input) => { await handleCreateIssue(input) }}
      />

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
    </div>
  )
}
