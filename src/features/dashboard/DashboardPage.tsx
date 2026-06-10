import { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { MoreHorizontal, FolderPlus, LayoutGrid, FolderOpen, Copy, Archive, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOrgStore } from '@/store/useOrgStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useIssueStore } from '@/store/useIssueStore'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { ProjectCardSkeleton } from '@/components/blocks/ProjectCardSkeleton'
import { QuickSearchModal } from './QuickSearchModal'
import { calculateProjectStats } from '@/utils/projectStats'
import type { Project } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface DashboardOutletContext {
  onNewProject: () => void
}

// =============================================================================
// HELPERS
// =============================================================================

function formatMonth(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// =============================================================================
// PROJECT CARD
// =============================================================================

// =============================================================================
// PROJECT CARD
// =============================================================================

interface ProjectCardProps {
  project: Project
  stats: ReturnType<typeof calculateProjectStats>
  onOpen: (project: Project) => void
  index: number
}

function ProjectCard({ project, stats, onOpen, index }: ProjectCardProps) {
  const { slug } = useParams<{ slug: string }>()
  const color = project.color ?? '#6366f1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={() => onOpen(project)}
      data-testid="project-card"
      className="group relative w-full max-w-[320px] flex cursor-pointer flex-col gap-3 overflow-hidden rounded-xl bg-card p-4 ring-1 ring-border shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(project)
        }
      }}
    >
      {/* Left-edge status bar — 4px vertical accent */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
      />

      {/* Row 1 — Identity: project icon + name + key */}
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          {project.key.slice(0, 2)}
        </span>
        <h3 className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate leading-tight">
          {project.name}
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
          {project.key}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Project options"
              className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
            >
              <MoreHorizontal size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onSelect={() => onOpen(project)}>
              <FolderOpen className="text-muted-foreground" />
              Open project
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                void navigator.clipboard.writeText(`${window.location.origin}/${slug}/projects/${project.id}/board`)
              }}
            >
              <Copy className="text-muted-foreground" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Archive className="text-muted-foreground" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem disabled variant="destructive">
              <Trash2 />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Row 2 — Description (omitted if no description) */}
      {project.description && (
        <p className="text-xs text-muted-foreground truncate">
          {project.description}
        </p>
      )}

      {/* Row 3 — Stat strip (3 columns, uppercase labels) */}
      <dl className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60">
        <div className="flex flex-col gap-0.5">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">To Do</dt>
          <dd className="text-sm font-semibold text-foreground tabular-nums">{stats.todo}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Active</dt>
          <dd className="text-sm font-semibold text-foreground tabular-nums">{stats.inProgress}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Done</dt>
          <dd className="text-sm font-semibold text-foreground tabular-nums">{stats.completed}</dd>
        </div>
      </dl>

      {/* Row 4 — Progress bar (linear) */}
      <div className="flex items-center gap-2">
        <Progress
          value={stats.completionPercentage}
          className="h-1.5 flex-1 [&>[data-slot=progress-indicator]]:bg-[var(--project-color)]"
          style={{ '--project-color': color } as React.CSSProperties}
        />
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums shrink-0">
          {stats.completionPercentage}%
        </span>
      </div>
    </motion.div>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ onNewProject }: { onNewProject: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
        <FolderPlus size={24} className="text-brand-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">No projects yet</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Create your first project to start tracking issues and shipping faster.
        </p>
      </div>
      <Button
        onClick={onNewProject}
        className="bg-brand-primary hover:bg-brand-primary-hover text-white border-0 gap-2"
      >
        <FolderPlus size={16} />
        Create your first project
      </Button>
    </div>
  )
}

// =============================================================================
// DASHBOARD PAGE
// =============================================================================

export default function DashboardPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const projects = useProjectStore((s) => s.projects)
  const issues = useIssueStore((s) => s.issues)
  const statuses = useIssueStore((s) => s.statuses)
  const { onNewProject } = useOutletContext<DashboardOutletContext>()

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Keyboard shortcuts
  useKeyboardShortcut('k', () => setIsSearchOpen(true), { ctrlKey: true })
  useKeyboardShortcut('c', () => onNewProject(), { shiftKey: true })

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = projects.filter((p) => !p.isArchived)
      if (active.length === 0) return

      const cols = Math.min(3, window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1)
      let newIndex: number

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          newIndex = Math.min(selectedCardIndex + 1, active.length - 1)
          setSelectedCardIndex(newIndex)
          break
        case 'ArrowLeft':
          e.preventDefault()
          newIndex = Math.max(selectedCardIndex - 1, 0)
          setSelectedCardIndex(newIndex)
          break
        case 'ArrowDown':
          e.preventDefault()
          newIndex = Math.min(selectedCardIndex + cols, active.length - 1)
          setSelectedCardIndex(newIndex)
          break
        case 'ArrowUp':
          e.preventDefault()
          newIndex = Math.max(selectedCardIndex - cols, 0)
          setSelectedCardIndex(newIndex)
          break
        case 'Enter':
          e.preventDefault()
          navigate(`/${slug}/projects/${active[selectedCardIndex]!.id}/board`)
          return
        default:
          return
      }

      cardRefs.current[newIndex]?.focus()
      cardRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCardIndex, projects, slug, navigate])

  const active = projects.filter((p) => !p.isArchived)
  const archived = projects.filter((p) => p.isArchived)

  const openBoard = (project: Project) => {
    navigate(`/${slug}/projects/${project.id}/board`)
  }

  if (projects.length === 0) {
    return <EmptyState onNewProject={onNewProject} />
  }

  const isLoading = false // You can add actual loading state from your data fetching logic

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-8 py-6 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">Projects</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentOrg?.name ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{formatMonth()}</span>
              <Button
                onClick={onNewProject}
                className="h-8 px-3 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0 gap-1.5"
                title="Shift+C"
              >
                <FolderPlus size={14} />
                New project
              </Button>
            </div>
          </div>

          {/* Stats row with filters */}
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-bold text-foreground">{projects.length}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary inline-block" />
                  Total Projects
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-bold text-foreground">{active.length}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Active
                </span>
              </div>
              {archived.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xl font-bold text-foreground">{archived.length}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
                    Archived
                  </span>
                </div>
              )}
            </div>

            {/* Quick filters */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Cmd+K"
                className="h-8 px-3 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
              >
                Search
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Flush separator — spans the full content width,
              negating the parent's px-8 so the line is edge-to-edge. */}
          <div className="mt-4 -mx-8 h-px bg-border" />

          {/* Project grid — auto-fit columns. Each card caps at 320px via
              max-w-[320px] inside ProjectCard so cards never stretch on
              wide viewports (the production-grade target from the design
              synthesis: Linear–Stripe hybrid). */}
          {isLoading ? (
            <div
              data-testid="project-grid"
              className="grid gap-4 justify-items-start"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div
                data-testid="project-grid"
                className="grid gap-4 justify-items-start"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
              >
                {active.map((project, index) => {
                  const stats = calculateProjectStats(issues, project.id, statuses)
                  return (
                    <div
                      key={project.id}
                      ref={(el) => {
                        cardRefs.current[index] = el
                      }}
                      className={`w-full max-w-[320px] outline-none ${
                        selectedCardIndex === index ? 'ring-2 ring-brand-primary rounded-xl' : ''
                      }`}
                    >
                      <ProjectCard
                        project={project}
                        stats={stats}
                        onOpen={openBoard}
                        index={index}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Archived section */}
              {archived.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Archived
                  </p>
                  <div
                    className="grid gap-4 opacity-60 justify-items-start"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                  >
                    {archived.map((project, index) => {
                      const stats = calculateProjectStats(issues, project.id, statuses)
                      return (
                        <div key={project.id} className="w-full max-w-[320px]">
                          <ProjectCard
                            project={project}
                            stats={stats}
                            onOpen={openBoard}
                            index={active.length + index}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Search Modal */}
      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
