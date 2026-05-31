import { Clock } from 'lucide-react'
import { mergeActivity, formatFieldChange } from '@/utils/activityHelpers'
import type { ActivityItem } from '@/utils/activityHelpers'
import type { Comment, IssueHistoryEntry, IssueStatus } from '@/types'

// =============================================================================
// PROPS
// =============================================================================

interface ActivityFeedProps {
  comments:          Comment[]
  history:           IssueHistoryEntry[]
  statuses:          IssueStatus[]
  onDeleteComment?:  (commentId: string) => void
}

// =============================================================================
// HELPERS
// =============================================================================

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

// =============================================================================
// AVATAR
// =============================================================================

function Avatar({ name, url }: { name: string; url?: string | null }) {
  return url ? (
    <img src={url} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white text-[9px] font-semibold shrink-0">
      {initials(name)}
    </div>
  )
}

// =============================================================================
// SINGLE ACTIVITY ROW
// =============================================================================

function ActivityRow({
  item,
  statuses,
}: {
  item:     ActivityItem
  statuses: IssueStatus[]
}) {
  return (
    <div className="flex gap-2.5">
      <Avatar name={item.authorName} url={item.authorAvatar} />

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {/* Header — name + timestamp + history icon */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-foreground">{item.authorName}</span>
          {item.type === 'history' && (
            <Clock size={10} className="text-muted-foreground/60 shrink-0" />
          )}
          <span className="text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</span>
        </div>

        {/* Body — differs by type */}
        {item.type === 'comment' ? (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">
            {item.body}
            {item.isEdited && (
              <span className="ml-1.5 text-[10px] text-muted-foreground/60">(edited)</span>
            )}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            {formatFieldChange(
              item.fieldChanged ?? '',
              item.oldValue ?? null,
              item.newValue ?? null,
              statuses,
            )}
          </p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// ACTIVITY FEED
// =============================================================================

export function ActivityFeed({
  comments,
  history,
  statuses,
}: ActivityFeedProps) {
  const items = mergeActivity(comments, history)

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/60 italic">No activity yet.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} statuses={statuses} />
      ))}
    </div>
  )
}
