import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Check, Layers, Pencil, Trash2 } from 'lucide-react'
import { useBacklog } from '@/hooks/useBacklog'
import { useProjectStore } from '@/store/useProjectStore'
import { useProject } from '@/hooks/useProject'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IssueSlideOver } from '../components/IssueSlideOver'
import { SprintPanel } from '../components/SprintPanel'
import { BacklogIssueRow } from '../components/BacklogIssueRow'
import { CreateSprintModal } from '../components/CreateSprintModal'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { CreateCategoryModal } from '../components/CreateCategoryModal'
import { SprintSettings } from '../components/SprintSettings'
import type { Category, Sprint } from '@/types'

// =============================================================================
// CONSTANTS
// =============================================================================

const TABS = ['Board', 'Backlog', 'Timeline', 'List'] as const
type Tab = (typeof TABS)[number]

// =============================================================================
// CATEGORY ASSIGN-SPRINT DROPDOWN
// =============================================================================

interface AssignSprintDropdownProps {
  category:    Category
  sprints:     Sprint[]
  onAssign:    (categoryId: string, sprintId: string) => Promise<void>
  onUnassign:  (categoryId: string) => Promise<void>
}

function AssignSprintDropdown({ category, sprints, onAssign, onUnassign }: AssignSprintDropdownProps) {
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

  const assignedSprint = sprints.find((s) => s.id === category.sprintId)
  const availableSprints = sprints.filter((s) => s.status !== 'completed')

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'h-6 flex items-center gap-1.5 px-2 rounded-md border text-xs font-medium transition-colors',
          assignedSprint
            ? 'border-blue-500/40 bg-blue-500/10 text-blue-500'
            : 'border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40',
        ].join(' ')}
      >
        <Layers size={10} />
        <span>{assignedSprint ? assignedSprint.name : 'Assign to sprint'}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-background border border-border rounded-lg shadow-xl z-30 overflow-hidden">
          <div className="px-2 py-1.5 flex flex-col gap-0.5">
            {assignedSprint && (
              <button
                type="button"
                onClick={() => { void onUnassign(category.id); setOpen(false) }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                Remove from sprint
              </button>
            )}
            {availableSprints.length === 0 && !assignedSprint && (
              <p className="px-2.5 py-2 text-xs text-muted-foreground">No available sprints</p>
            )}
            {availableSprints.map((sprint) => (
              <button
                key={sprint.id}
                type="button"
                onClick={() => { void onAssign(category.id, sprint.id); setOpen(false) }}
                className={[
                  'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left',
                  sprint.id === category.sprintId
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'text-foreground hover:bg-muted/60',
                ].join(' ')}
              >
                <span>{sprint.name}</span>
                {sprint.id === category.sprintId && <Check size={11} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// BACKLOG PAGE
// =============================================================================

export default function BacklogPage() {
  const navigate   = useNavigate()
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>()

  const currentProject = useProjectStore((s) => s.currentProject)
  const { updateProject } = useProject()

  const {
    sprints, backlogIssues, statuses, categories, isLoading, isCreatingSprint, allIssues,
    loadBacklog, handleCreateSprint, handleUpdateCategory, handleDeleteCategory,
    handleCreateIssue, handleStartSprint, handleCompleteSprint,
    handleAssignCategoryToSprint, handleUnassignCategoryFromSprint,
  } = useBacklog(slug ?? '', projectId ?? '')

  useEffect(() => { void loadBacklog() }, [slug, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedIssueId,    setSelectedIssueId]    = useState<string | null>(null)
  const [isSlideOverOpen,    setIsSlideOverOpen]    = useState(false)
  const [isSprintModalOpen,  setIsSprintModalOpen]  = useState(false)
  const [isIssueModalOpen,   setIsIssueModalOpen]   = useState(false)
  const [editingCategory,    setEditingCategory]    = useState<import('@/types').Category | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [defaultCategoryId,  setDefaultCategoryId]  = useState<string | undefined>(undefined)

  const handleIssueClick = (issueId: string) => {
    setSelectedIssueId(issueId)
    setIsSlideOverOpen(true)
  }

  const handleTabClick = (tab: Tab) => {
    if (tab === 'Board') navigate(`/${slug}/projects/${projectId}/board`)
  }

  const openCreateIssueModal = (categoryId?: string) => {
    setDefaultCategoryId(categoryId)
    setIsIssueModalOpen(true)
  }

  const projectKey = currentProject?.key ?? ''

  // One category block: header (with sprint assignment + edit/delete) and its
  // backlog issues. Plain render helper — issues already in a sprint appear in
  // the SprintPanels above, so only sprint-less issues are listed here.
  const renderCategoryBlock = (category: Category) => {
    const catIssues = backlogIssues.filter((i) => i.categoryId === category.id)
    return (
      <div key={category.id} className="border-t border-border/60">
        {/* Category header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/10">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: category.color }}
          />
          <span className="text-xs font-semibold text-foreground flex-1">
            {category.name}
            <span className="ml-1.5 text-muted-foreground font-normal">({catIssues.length})</span>
          </span>
          <AssignSprintDropdown
            category={category}
            sprints={sprints}
            onAssign={handleAssignCategoryToSprint}
            onUnassign={handleUnassignCategoryFromSprint}
          />
          <button
            type="button"
            onClick={() => setEditingCategory(category)}
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit category"
          >
            <Pencil size={11} />
          </button>
          {deletingCategoryId === category.id ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { void handleDeleteCategory(category.id); setDeletingCategoryId(null) }}
                className="h-6 flex items-center gap-1 px-2 rounded text-xs font-medium text-destructive border border-destructive/40 hover:bg-destructive/10 transition-colors"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeletingCategoryId(null)}
                className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeletingCategoryId(category.id)}
              className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete category"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {/* Issues in this category's backlog */}
        {catIssues.length === 0 ? (
          <p className="px-8 py-2 text-xs text-muted-foreground italic">
            No backlog issues in this category
          </p>
        ) : (
          catIssues.map((issue) => (
            <BacklogIssueRow
              key={issue.id}
              issue={issue}
              projectKey={projectKey}
              onClick={handleIssueClick}
              sprints={[]}
            />
          ))
        )}

        {/* Add issue to category */}
        <button
          type="button"
          onClick={() => openCreateIssueModal(category.id)}
          className="w-full flex items-center gap-2 px-8 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Plus size={11} />
          Add issue
        </button>
      </div>
    )
  }

  // Categories grouped by sprint assignment: each sprint heads its assigned
  // categories; categories with no sprint fall under "Unassigned"
  const sprintGroups = sprints
    .map((sprint) => ({
      sprint,
      cats: categories.filter((c) => c.sprintId === sprint.id),
    }))
    .filter((g) => g.cats.length > 0)

  const unassignedCategories = categories.filter(
    (c) => !sprints.some((s) => s.id === c.sprintId)
  )

  // Issues not yet in any known category (edge case)
  const uncategorisedIssues = backlogIssues.filter(
    (i) => !categories.some((c) => c.id === i.categoryId)
  )

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
            <Badge variant="secondary" className="h-4 px-1.5 text-xs font-mono text-muted-foreground">
              {currentProject?.key ?? ''}
            </Badge>
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
        <Tabs
          value="Backlog"
          onValueChange={(v) => handleTabClick(v as Tab)}
          className="px-5"
        >
          <TabsList variant="line">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="px-3 py-2 text-sm data-active:text-brand-primary after:bg-brand-primary"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
          {/* Sprint settings (weekly auto-create toggle) */}
          {currentProject && (
            <SprintSettings
              project={currentProject}
              onSave={async (input) => {
                await updateProject(slug ?? '', projectId ?? '', input)
              }}
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
            />
          ))}

          {/* Backlog section — grouped by category */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30">
              <span className="text-sm font-medium text-foreground flex-1">
                Backlog ({backlogIssues.length})
              </span>
            </div>

            {categories.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground text-center">
                No categories yet. Create one from the Board.
              </p>
            ) : (
              <>
                {/* Categories grouped under their assigned sprint */}
                {sprintGroups.map(({ sprint, cats }) => (
                  <div key={sprint.id} data-testid={`sprint-group-${sprint.id}`}>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 border-t border-border/60">
                      <Layers size={11} className="text-blue-500 shrink-0" />
                      <span className="text-xs font-semibold text-blue-500">{sprint.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {cats.length} {cats.length === 1 ? 'category' : 'categories'}
                      </span>
                    </div>
                    {cats.map(renderCategoryBlock)}
                  </div>
                ))}

                {/* Categories with no sprint */}
                {unassignedCategories.length > 0 && (
                  <div data-testid="sprint-group-unassigned">
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-t border-border/60">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                      <span className="text-xs font-semibold text-muted-foreground">Unassigned</span>
                      <span className="text-[11px] text-muted-foreground/70">
                        {unassignedCategories.length} {unassignedCategories.length === 1 ? 'category' : 'categories'}
                      </span>
                    </div>
                    {unassignedCategories.map(renderCategoryBlock)}
                  </div>
                )}
              </>
            )}

            {/* Uncategorised issues (fallback) */}
            {uncategorisedIssues.length > 0 && (
              <div className="border-t border-border/60">
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/10">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-muted-foreground/30" />
                  <span className="text-xs font-semibold text-muted-foreground flex-1">
                    Uncategorised ({uncategorisedIssues.length})
                  </span>
                </div>
                {uncategorisedIssues.map((issue) => (
                  <BacklogIssueRow
                    key={issue.id}
                    issue={issue}
                    projectKey={projectKey}
                    onClick={handleIssueClick}
                    sprints={[]}
                  />
                ))}
              </div>
            )}

            {/* Create issue footer */}
            <button
              type="button"
              onClick={() => openCreateIssueModal()}
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
      <CreateCategoryModal
        isOpen={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        initialValues={editingCategory ?? undefined}
        onSubmit={async (name, color, description) => {
          if (editingCategory) {
            await handleUpdateCategory(editingCategory.id, { name, color, description: description ?? null })
          }
        }}
      />

      <CreateSprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSubmit={handleCreateSprint}
      />

      <CreateIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => { setIsIssueModalOpen(false); setDefaultCategoryId(undefined) }}
        defaultStatusId={statuses[0]?.id ?? ''}
        statuses={statuses}
        categories={defaultCategoryId
          ? [categories.find((c) => c.id === defaultCategoryId)!, ...categories.filter((c) => c.id !== defaultCategoryId)]
          : categories
        }
        onSubmit={async (input) => { await handleCreateIssue(input) }}
      />

      <AnimatePresence>
        {selectedIssueId && (
          <IssueSlideOver
            key={selectedIssueId}
            issueId={selectedIssueId}
            isOpen={isSlideOverOpen}
            onClose={() => setIsSlideOverOpen(false)}
            categories={categories}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
