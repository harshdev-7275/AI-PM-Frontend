import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { MoreHorizontal, FolderPlus, ArrowRight, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrgStore } from '@/store/useOrgStore'
import { useProjectStore } from '@/store/useProjectStore'
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

interface ProjectCardProps {
  project: Project
  onOpen:  (project: Project) => void
}

function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const color = project.color ?? '#6366f1'
  const rgb   = hexToRgb(color)

  return (
    <div
      className="relative flex flex-col rounded-2xl p-5 cursor-pointer group transition-transform hover:-translate-y-0.5"
      style={{
        background:  `linear-gradient(135deg, rgba(${rgb}, 0.18) 0%, rgba(${rgb}, 0.08) 100%)`,
        border:      `1px solid rgba(${rgb}, 0.25)`,
      }}
      onClick={() => onOpen(project)}
    >
      {/* Top row — date + menu */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] text-muted-foreground">
          {formatDate(project.createdAt)}
        </span>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Project name + key */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-base font-semibold text-foreground leading-tight">
          {project.name}
        </h3>
        <span
          className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
          style={{
            backgroundColor: `rgba(${rgb}, 0.25)`,
            color,
          }}
        >
          {project.key}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-5 line-clamp-1 min-h-[16px]">
        {project.description ?? 'No description'}
      </p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-medium" style={{ color }}>—</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: '0%', backgroundColor: color }}
          />
        </div>
      </div>

      {/* Footer — open board */}
      <div className="flex items-center justify-end">
        <div
          className="flex items-center gap-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color }}
        >
          Open board
          <ArrowRight size={11} />
        </div>
      </div>
    </div>
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
  const navigate              = useNavigate()
  const { slug }              = useParams<{ slug: string }>()
  const currentOrg            = useOrgStore((s) => s.currentOrg)
  const projects              = useProjectStore((s) => s.projects)
  const { onNewProject }      = useOutletContext<DashboardOutletContext>()

  const active   = projects.filter((p) => !p.isArchived)
  const archived = projects.filter((p) => p.isArchived)

  const openBoard = (project: Project) => {
    navigate(`/${slug}/projects/${project.id}/board`)
  }

  if (projects.length === 0) {
    return <EmptyState onNewProject={onNewProject} />
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-6 max-w-6xl w-full mx-auto">

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
            >
              <FolderPlus size={14} />
              New project
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8 mb-8 pb-6 border-b border-border">
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

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={openBoard} />
          ))}
        </div>

        {/* Archived section */}
        {archived.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Archived
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
              {archived.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={openBoard} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
