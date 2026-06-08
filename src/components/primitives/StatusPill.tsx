import {
  AlertCircle,
  AlertTriangle,
  CircleDashed,
  Clock,
  HelpCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import type { ChatStatus } from '@/store/useChatStore'
import { cn } from '@/lib/utils'

type StatusConfig = {
  label: string
  className: string
  Icon: LucideIcon
  tooltip: string
}

// One config per non-success status. Tones: amber = needs user action,
// red = failure, blue = follow-up, zinc = soft/cancelled. Mirrors the
// colour language used by RoleBadge so the chat feels of a piece with
// the rest of the app.
const STATUS_CONFIG: Record<Exclude<ChatStatus, 'executed'>, StatusConfig> = {
  awaiting_confirmation: {
    label: 'Awaiting confirmation',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Icon: Clock,
    tooltip: 'The AI proposed a write — confirm to apply',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-300',
    Icon: XCircle,
    tooltip: 'You declined this proposed change',
  },
  quota_exceeded: {
    label: 'Usage limit',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    Icon: AlertCircle,
    tooltip: 'This org has hit its token quota for the period',
  },
  validation_failed: {
    label: 'Not found',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Icon: AlertTriangle,
    tooltip: "The AI couldn't find what you asked about",
  },
  needs_input: {
    label: 'Needs more info',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Icon: CircleDashed,
    tooltip: 'Reply with the missing detail to continue',
  },
  needs_clarification: {
    label: 'Follow-up',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Icon: HelpCircle,
    tooltip: 'The AI is asking for clarification',
  },
  error: {
    label: 'Error',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    Icon: AlertCircle,
    tooltip: 'The model call failed — try again',
  },
}

interface StatusPillProps {
  status?: ChatStatus
  intent?: string
  className?: string
}

// Usage: render the lifecycle tag for an assistant message as a single
// icon + label pill (one per status). Renders nothing for the happy-path
// "executed" status. The intent chip is a separate, small mono label so
// status stays visually dominant.
//
//   <StatusPill status="awaiting_confirmation" />
//   <StatusPill status="executed" intent="create_issue" />
//   <StatusPill />  // nothing

export function StatusPill({ status, intent, className }: StatusPillProps) {
  if (!status && !intent) return null

  if (!status || status === 'executed') {
    return intent ? <IntentChip intent={intent} /> : null
  }

  const cfg = STATUS_CONFIG[status]
  const { Icon } = cfg

  return (
    <div
      data-testid="status-row"
      className={cn('flex items-center gap-1.5', className)}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
          cfg.className,
        )}
        title={cfg.tooltip}
      >
        <Icon size={10} />
        {cfg.label}
      </span>
      {intent && <IntentChip intent={intent} />}
    </div>
  )
}

function IntentChip({ intent }: { intent: string }) {
  return (
    <span
      data-testid="status-intent"
      className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
      title="AI intent classification"
    >
      {intent}
    </span>
  )
}
