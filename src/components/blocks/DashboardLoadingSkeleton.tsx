import { FolderPlus, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrgStore } from '@/store/useOrgStore'
import { ProjectCardSkeleton } from '@/components/blocks/ProjectCardSkeleton'

function formatMonth(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function DashboardLoadingSkeleton() {
  const orgName = useOrgStore((s) => s.currentOrg?.name) ?? '—'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-6 w-full">
        {/* Header — real chrome, not skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{orgName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{formatMonth()}</span>
            <Button
              disabled
              className="h-8 px-3 text-sm bg-brand-primary hover:bg-brand-primary-hover text-white border-0 gap-1.5"
            >
              <FolderPlus size={14} />
              New project
            </Button>
          </div>
        </div>

        {/* Stats — show 0 until data arrives */}
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold text-foreground">0</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary inline-block" />
                Total Projects
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold text-foreground">0</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="h-8 px-3 text-sm rounded-lg text-muted-foreground font-medium"
            >
              Search
            </button>
            <button
              type="button"
              disabled
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="mt-4 -mx-8 h-px bg-border" />

        {/* Single skeleton card */}
        <div
          className="grid gap-4 justify-items-start mt-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          <ProjectCardSkeleton />
        </div>
      </div>
    </div>
  )
}
