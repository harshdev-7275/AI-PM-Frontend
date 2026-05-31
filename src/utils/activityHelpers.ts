import type { Comment, IssueHistoryEntry, IssueStatus } from '@/types'

// =============================================================================
// ACTIVITY ITEM — unified shape for comments and history entries
// =============================================================================

export type ActivityItem = {
  id:           string
  type:         'comment' | 'history'
  authorName:   string
  authorAvatar: string | null
  timestamp:    string          // ISO string — used for sort
  // comment-specific
  body?:        string
  isEdited?:    boolean
  commentId?:   string
  // history-specific
  fieldChanged?: string
  oldValue?:     string | null
  newValue?:     string | null
}

// =============================================================================
// formatFieldChange
// Converts raw DB field/value data into a human-readable activity string.
// =============================================================================

export function formatFieldChange(
  fieldChanged: string,
  oldValue:     string | null,
  newValue:     string | null,
  statuses:     IssueStatus[],
): string {
  const findStatus = (id: string | null) =>
    id ? (statuses.find((s) => s.id === id)?.name ?? null) : null

  switch (fieldChanged) {
    case 'status_id': {
      const from = findStatus(oldValue)
      const to   = findStatus(newValue)
      if (from && to)  return `changed status from ${from} to ${to}`
      if (to)          return `changed status to ${to}`
      return 'changed status'
    }

    case 'priority': {
      const cap = (v: string | null) =>
        v ? v.charAt(0).toUpperCase() + v.slice(1) : null
      const from = cap(oldValue)
      const to   = cap(newValue)
      if (from && to)  return `changed priority from ${from} to ${to}`
      if (to)          return `changed priority to ${to}`
      return 'changed priority'
    }

    case 'title':
      return 'changed title'

    case 'description':
      return newValue ? 'updated description' : 'removed description'

    case 'assignee_id':
      return newValue ? 'changed assignee' : 'removed assignee'

    case 'due_date': {
      if (!newValue) return 'removed due date'
      const formatted = new Date(newValue).toLocaleDateString('en-US', {
        month: 'short',
        day:   'numeric',
        year:  'numeric',
      })
      return `changed due date to ${formatted}`
    }

    case 'parent_id':
      return newValue ? 'set parent issue' : 'removed parent issue'

    case 'story_points':
      return newValue ? `changed story points to ${newValue}` : 'removed story points'

    case 'estimated_hours':
      return newValue ? `changed estimate to ${newValue}h` : 'removed estimate'

    case 'actual_hours':
      return newValue ? `logged ${newValue}h` : 'removed logged hours'

    default:
      return `changed ${fieldChanged.replace(/_/g, ' ')}`
  }
}

// =============================================================================
// mergeActivity
// Merges comments and history into one list sorted newest-first.
// =============================================================================

export function mergeActivity(
  comments: Comment[],
  history:  IssueHistoryEntry[],
): ActivityItem[] {
  const commentItems: ActivityItem[] = comments.map((c) => ({
    id:           c.id,
    type:         'comment',
    authorName:   c.author.name,
    authorAvatar: c.author.avatarUrl,
    timestamp:    c.createdAt,
    body:         c.body,
    isEdited:     c.isEdited,
    commentId:    c.id,
  }))

  const historyItems: ActivityItem[] = history.map((h) => ({
    id:           h.id,
    type:         'history',
    authorName:   h.changedBy.name,
    authorAvatar: h.changedBy.avatarUrl,
    timestamp:    h.changedAt,
    fieldChanged: h.fieldChanged,
    oldValue:     h.oldValue,
    newValue:     h.newValue,
  }))

  return [...commentItems, ...historyItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}
