import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart2, PieChart as PieIcon, TrendingUp } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useBacklog } from '@/hooks/useBacklog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Sprint, Issue, IssueStatus } from '@/types'

// =============================================================================
// CHART CONFIGS
// =============================================================================

const VELOCITY_CONFIG = {
  completed: { label: 'Completed', color: 'var(--chart-1)' },
  carried:   { label: 'Carried over', color: 'var(--chart-2)' },
} satisfies ChartConfig

// Builds the velocity series: for each non-planned sprint, how many of its
// issues were completed during the window vs. carried over to the backlog or
// the next sprint.
function useVelocitySeries(sprints: Sprint[], issues: Issue[]) {
  return useMemo(() => {
    return sprints
      .filter((s) => s.status !== 'planned')
      .map((sprint) => {
        const sprintIssues = issues.filter((i) => i.sprintId === sprint.id)
        const completed    = sprintIssues.filter((i) => i.completedAt).length
        const carried      = sprintIssues.length - completed
        return {
          sprint:    sprint.name.length > 14 ? `${sprint.name.slice(0, 14)}…` : sprint.name,
          completed,
          carried,
        }
      })
  }, [sprints, issues])
}

// =============================================================================
// STATUS DISTRIBUTION
// =============================================================================

function useStatusDistribution(statuses: IssueStatus[], issues: Issue[]) {
  return useMemo(() => {
    return statuses
      .map((status) => ({
        name:  status.name,
        value: issues.filter((i) => i.statusId === status.id).length,
        color: status.color || 'var(--muted-foreground)',
      }))
      .filter((row) => row.value > 0)
  }, [statuses, issues])
}

// =============================================================================
// ANALYTICS PAGE
// =============================================================================

// STATCARD — small reused tile (module level so it isn't re-created per render)
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">{value}</p>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { slug } = useParams<{ slug: string }>()
  const projects = useProjectStore((s) => s.projects)

  const [projectId, setProjectId] = useState<string>('')

  // Default to the first project once they load (render-time adjustment)
  if (!projectId && projects.length > 0) {
    setProjectId(projects[0]!.id)
  }

  const { sprints, allIssues, statuses, isLoading, loadBacklog } = useBacklog(
    slug ?? '',
    projectId,
  )

  // Reload whenever the project picker changes.
  useEffect(() => {
    if (slug && projectId) void loadBacklog()
  }, [slug, projectId, loadBacklog])

  const velocity         = useVelocitySeries(sprints, allIssues)
  const statusBreakdown  = useStatusDistribution(statuses, allIssues)

  const totals = useMemo(
    () => ({
      issues:    allIssues.length,
      completed: allIssues.filter((i) => i.completedAt).length,
      sprints:   sprints.length,
    }),
    [allIssues, sprints],
  )

  const currentProject = projects.find((p) => p.id === projectId)

  return (
    <div className="flex flex-col gap-6 px-6 py-6 max-w-6xl">
      {/* Header */}
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {currentProject ? currentProject.name : 'Select a project to view stats'}
          </p>
        </div>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="h-8 w-48 text-sm">
            <SelectValue placeholder="Select a project…" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Issues"           value={totals.issues} />
        <Stat label="Completed"        value={totals.completed} />
        <Stat label="Sprints to date"  value={totals.sprints} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Velocity */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <BarChart2 size={14} className="text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Sprint velocity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <p className="py-12 text-xs text-muted-foreground text-center">Loading…</p>
            ) : velocity.length === 0 ? (
              <p className="py-12 text-xs text-muted-foreground text-center">
                No completed or active sprints yet.
              </p>
            ) : (
              <ChartContainer config={VELOCITY_CONFIG} className="h-[240px] w-full">
                <BarChart data={velocity} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="sprint" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="carried"   stackId="a" fill="var(--color-carried)"   radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <PieIcon size={14} className="text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <p className="py-12 text-xs text-muted-foreground text-center">Loading…</p>
            ) : statusBreakdown.length === 0 ? (
              <p className="py-12 text-xs text-muted-foreground text-center">
                No issues to chart yet.
              </p>
            ) : (
              <ChartContainer
                config={Object.fromEntries(
                  statusBreakdown.map((s) => [s.name, { label: s.name, color: s.color }]),
                )}
                className="h-[240px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {statusBreakdown.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer hint */}
      <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
        <TrendingUp size={11} />
        Velocity counts how many issues in each sprint were completed by sprint end vs carried over.
      </p>
    </div>
  )
}
