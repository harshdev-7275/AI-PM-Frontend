import { useState, useMemo } from 'react'
import { ChevronRight, Play, CheckCheck, TrendingDown } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { Sprint, Issue, SprintStatus } from '@/types'
import { BacklogIssueRow } from './BacklogIssueRow'

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_BADGE: Record<SprintStatus, string> = {
  planned:   'bg-muted text-muted-foreground',
  active:    'bg-blue-500/10 text-blue-600',
  completed: 'bg-green-500/10 text-green-600',
}

const BURNDOWN_CHART_CONFIG = {
  remaining: { label: 'Remaining', color: 'var(--chart-1)' },
  ideal:     { label: 'Ideal',     color: 'var(--muted-foreground)' },
} satisfies ChartConfig

// =============================================================================
// BURNDOWN
// =============================================================================

// Builds the per-day data series the burndown chart consumes. For each day in
// the sprint window: how many issues are still open (not yet completed).
// "Today" cuts the actual line off so we don't draw points for the future.
function useBurndownSeries(sprint: Sprint, issues: Issue[]) {
  return useMemo(() => {
    if (!sprint.startDate || !sprint.endDate || issues.length === 0) return []

    const start = new Date(`${sprint.startDate.slice(0, 10)}T00:00:00`)
    const end   = new Date(`${sprint.endDate.slice(0, 10)}T23:59:59`)
    const today = new Date()

    const total = issues.length
    const dayMs = 86_400_000
    const days  = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / dayMs))

    const points: { day: string; remaining: number | null; ideal: number }[] = []
    for (let i = 0; i <= days; i++) {
      const date = new Date(start.getTime() + i * dayMs)
      const inFuture = date.getTime() > today.getTime()

      const completedByDate = issues.filter(
        (it) => it.completedAt && new Date(it.completedAt).getTime() <= date.getTime(),
      ).length

      points.push({
        day:       date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        remaining: inFuture ? null : Math.max(0, total - completedByDate),
        ideal:     Math.max(0, total - (total * i) / days),
      })
    }
    return points
  }, [sprint.startDate, sprint.endDate, issues])
}

function SprintBurndown({ sprint, issues }: { sprint: Sprint; issues: Issue[] }) {
  const data = useBurndownSeries(sprint, issues)

  if (data.length === 0) {
    return (
      <p className="px-4 py-6 text-xs text-muted-foreground text-center">
        Burndown becomes available once the sprint has a start + end date and at least one issue.
      </p>
    )
  }

  return (
    <ChartContainer
      config={BURNDOWN_CHART_CONFIG}
      className="h-[180px] w-full px-4 py-3"
    >
      <AreaChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="burndown-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--color-remaining)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-remaining)" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={28}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="remaining"
          stroke="var(--color-remaining)"
          fill="url(#burndown-fill)"
          strokeWidth={2}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="ideal"
          stroke="var(--color-ideal)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

// =============================================================================
// SPRINT PANEL
// =============================================================================

interface SprintPanelProps {
  sprint:            Sprint
  issues:            Issue[]
  projectKey:        string
  onIssueClick:      (issueId: string) => void
  onStartSprint?:    (sprintId: string) => Promise<void>
  onCompleteSprint?: (sprintId: string) => Promise<void>
  onRemoveIssue?:    (sprintId: string, issueId: string) => Promise<void>
}

export function SprintPanel({
  sprint,
  issues,
  projectKey,
  onIssueClick,
  onStartSprint,
  onCompleteSprint,
  onRemoveIssue,
}: SprintPanelProps) {
  const [isOpen,       setIsOpen]       = useState(sprint.status === 'active')
  const [showBurndown, setShowBurndown] = useState(sprint.status === 'active')
  const [isActioning,  setIsActioning]  = useState(false)

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onStartSprint || isActioning) return
    setIsActioning(true)
    try { await onStartSprint(sprint.id) } finally { setIsActioning(false) }
  }

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onCompleteSprint || isActioning) return
    setIsActioning(true)
    try { await onCompleteSprint(sprint.id) } finally { setIsActioning(false) }
  }

  // Burndown is only meaningful for active or completed sprints with a window.
  const burndownAvailable =
    sprint.status !== 'planned' && !!sprint.startDate && !!sprint.endDate

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <ChevronRight
          size={14}
          className={`text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium text-foreground flex-1 truncate">{sprint.name}</span>

        {sprint.startDate && sprint.endDate && (
          <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
            {sprint.startDate.slice(0, 10)} → {sprint.endDate.slice(0, 10)}
          </span>
        )}

        <Badge className={`h-4 px-1.5 text-[10px] rounded capitalize shrink-0 ${STATUS_BADGE[sprint.status]}`}>
          {sprint.status}
        </Badge>

        <span className="text-[11px] text-muted-foreground shrink-0">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>

        {sprint.status === 'planned' && onStartSprint && (
          <Button
            onClick={handleStart}
            disabled={isActioning}
            className="h-6 px-2 text-[11px] bg-blue-500 hover:bg-blue-600 text-white border-0 shrink-0 gap-1"
          >
            <Play size={10} />
            Start
          </Button>
        )}

        {sprint.status === 'active' && onCompleteSprint && (
          <Button
            onClick={handleComplete}
            disabled={isActioning}
            className="h-6 px-2 text-[11px] bg-green-600 hover:bg-green-700 text-white border-0 shrink-0 gap-1"
          >
            <CheckCheck size={10} />
            Complete
          </Button>
        )}
      </button>

      {/* Issue list */}
      {isOpen && (
        <div>
          {burndownAvailable && (
            <div className="border-b border-border/70">
              <button
                type="button"
                onClick={() => setShowBurndown((b) => !b)}
                className="w-full flex items-center gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                <TrendingDown size={12} className="shrink-0" />
                <span className="flex-1 text-left">Burndown</span>
                <ChevronRight
                  size={11}
                  className={`shrink-0 transition-transform ${showBurndown ? 'rotate-90' : ''}`}
                />
              </button>
              {showBurndown && <SprintBurndown sprint={sprint} issues={issues} />}
            </div>
          )}

          {issues.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground text-center">
              No issues in this sprint
            </p>
          ) : (
            issues.map((issue) => (
              <BacklogIssueRow
                key={issue.id}
                issue={issue}
                projectKey={projectKey}
                onClick={onIssueClick}
                {...(onRemoveIssue && sprint.status !== 'completed' && {
                  onRemove: () => onRemoveIssue(sprint.id, issue.id),
                })}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
