import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { useIssueStore } from '@/store/useIssueStore'
import { env } from '@/lib/env'
import type { Issue } from '@/types'

// =============================================================================
// EVENT TYPES — must match backend issues.sse.ts
// =============================================================================

type BoardEvent =
  | { type: 'CONNECTED' }
  | { type: 'ISSUE_STATUS_UPDATED'; issueId: string; statusId: string; actorId: string; actorName: string }
  | { type: 'ISSUE_CREATED'; issue: Issue; actorId: string; actorName: string }

// =============================================================================
// HOOK
// =============================================================================

export function useBoardEvents() {
  const { slug, projectId }  = useParams<{ slug: string; projectId: string }>()
  const accessToken          = useAuthStore((s) => s.accessToken)
  const currentUserId        = useAuthStore((s) => s.user?.id)
  const issues               = useIssueStore((s) => s.issues)
  const statuses             = useIssueStore((s) => s.statuses)
  const updateIssueStatus    = useIssueStore((s) => s.updateIssueStatus)
  const addIssue             = useIssueStore((s) => s.addIssue)

  useEffect(() => {
    if (!slug || !projectId || !accessToken) return

    const url = `${env.VITE_API_BASE_URL}/orgs/${slug}/projects/${projectId}/issues/events?token=${encodeURIComponent(accessToken)}`
    const es  = new EventSource(url)

    es.onmessage = (e: MessageEvent<string>) => {
      let event: BoardEvent
      try {
        event = JSON.parse(e.data) as BoardEvent
      } catch {
        return
      }

      if (event.type === 'CONNECTED') return

      const isMe = event.actorId === currentUserId
      const actor = isMe ? 'You' : event.actorName

      if (event.type === 'ISSUE_STATUS_UPDATED') {
        // Apply store update for other users (own action already optimistically applied)
        if (!isMe) updateIssueStatus(event.issueId, event.statusId)

        // Resolve names from store for the toast
        const issue      = issues.find((i) => i.id === event.issueId)
        const status     = statuses.find((s) => s.id === event.statusId)
        const issueTitle = issue?.title   ?? 'an issue'
        const statusName = status?.name   ?? 'a new column'

        toast(`${actor} moved "${issueTitle}" → ${statusName}`, {
          duration:  3000,
          icon:      isMe ? '✓' : '👤',
        })
      }

      if (event.type === 'ISSUE_CREATED') {
        if (!isMe) addIssue(event.issue)

        toast(`${actor} created "${event.issue.title}"`, {
          duration: 3000,
          icon:     isMe ? '✓' : '👤',
        })
      }
    }

    es.onerror = () => {
      // EventSource handles reconnection automatically
    }

    return () => es.close()
  }, [slug, projectId, accessToken]) // eslint-disable-line react-hooks/exhaustive-deps
}
