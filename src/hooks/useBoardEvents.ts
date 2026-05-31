import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useIssueStore } from '@/store/useIssueStore'
import { env } from '@/lib/env'
import type { Issue } from '@/types'

// =============================================================================
// EVENT TYPES — must match backend issues.sse.ts
// =============================================================================

type BoardEvent =
  | { type: 'CONNECTED' }
  | { type: 'ISSUE_STATUS_UPDATED'; issueId: string; statusId: string; actorId: string }
  | { type: 'ISSUE_CREATED'; issue: Issue; actorId: string }

// =============================================================================
// HOOK
// Opens an SSE connection to /board-events for the current project.
// Skips events triggered by the current user (they already have optimistic updates).
// EventSource auto-reconnects on drop — no manual retry logic needed.
// =============================================================================

export function useBoardEvents() {
  const { slug, projectId } = useParams<{ slug: string; projectId: string }>()
  const accessToken          = useAuthStore((s) => s.accessToken)
  const currentUserId        = useAuthStore((s) => s.user?.id)
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

      // Skip events from this user — they already applied optimistic updates
      if (event.type === 'CONNECTED') return

      if (event.type === 'ISSUE_STATUS_UPDATED' && event.actorId !== currentUserId) {
        updateIssueStatus(event.issueId, event.statusId)
      }

      if (event.type === 'ISSUE_CREATED' && event.actorId !== currentUserId) {
        addIssue(event.issue)
      }
    }

    es.onerror = () => {
      // EventSource handles reconnection automatically — no action needed
    }

    return () => es.close()
  }, [slug, projectId, accessToken]) // eslint-disable-line react-hooks/exhaustive-deps
}
