import { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { MoreHorizontal, FolderPlus, ArrowRight, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '99, 102, 241'
  return `${parseInt(result[1]!, 16)}, ${parseInt(result[2]!, 16)}, ${parseInt(result[3]!, 16)}`
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
  const color = project.color ?? '#6366f1'
  const rgb = hexToRgb(color)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex flex-col rounded-xl p-3.5 cursor-pointer group transition-transform hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, rgba(${rgb}, 0.18) 0%, rgba(${rgb}, 0.08) 100%)`,
        border: `1px solid rgba(${rgb}, 0.25)`,
      }}
      onClick={() => onOpen(project)}
    >
      {/* Top row — date + menu */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground">
          {formatDate(project.createdAt)}
        </span>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>

      {/* Project name + key */}
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <h3 className="text-sm font-semibold text-foreground leading-tight">
          {project.name}
        </h3>
        <span
          className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded shrink-0 mt-0.5"
          style={{
            backgroundColor: `rgba(${rgb}, 0.25)`,
            color,
          }}
        >
          {project.key}
        </span>
      </div>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1 min-h-[14px]">
        {project.description ?? 'No description'}
      </p>

      {/* Stats row — compact single line when total > 0 */}
      {stats.total > 0 && (
        <div className="mb-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span><span className="text-foreground font-semibold">{stats.todo}</span> To Do</span>
          <span><span className="text-foreground font-semibold">{stats.inProgress}</span> In Progress</span>
          <span><span className="text-foreground font-semibold">{stats.completed}</span> Done</span>
        </div>
      )}

      {/* Progress bar with animation */}
      <div className="mb-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Progress</span>
          <span className="text-[10px] font-medium" style={{ color }}>
            {stats.completionPercentage}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/10">
          <motion.div
            className="h-1 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Footer — open board */}
      <div className="flex items-center justify-end mt-0.5">
        <div
          className="flex items-center gap-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color }}
        >
          Open board
          <ArrowRight size={10} />
        </div>
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
      let newIndex = selectedCardIndex

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

          {/* Project grid */}
          {isLoading ? (
            <div
              data-testid="project-grid"
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div
                data-testid="project-grid"
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
              >
                {active.map((project, index) => {
                  const stats = calculateProjectStats(issues, project.id, statuses)
                  return (
                    <div
                      key={project.id}
                      ref={(el) => {
                        cardRefs.current[index] = el
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openBoard(project)
                      }}
                      className={`outline-none rounded-2xl transition-shadow ${
                        selectedCardIndex === index ? 'ring-2 ring-brand-primary' : ''
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
                    className="grid gap-4 opacity-50"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
                  >
                    {archived.map((project, index) => {
                      const stats = calculateProjectStats(issues, project.id, statuses)
                      return (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          stats={stats}
                          onOpen={openBoard}
                          index={active.length + index}
                        />
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
