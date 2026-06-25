import { useEffect, useState } from 'react'
import { useNavStore } from '@/store/useNavStore'
import { fetchSuggestions, type Suggestion } from '@/services/aiService'

/**
 * Provides contextual prompt suggestions for the chat page.
 *
 * Initial load: template chips based on the page the user came from (instant, no LLM).
 * After each AI reply: suggestions arrive through the SSE stream as a `suggestions`
 * event — ChatPage calls `setSuggestions` directly from the `onSuggestions` callback.
 */
export function useChatSuggestions() {
  const lastPage      = useNavStore((s) => s.lastPage)
  const lastProjectId = useNavStore((s) => s.lastProjectId)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    let cancelled = false
    fetchSuggestions(lastPage, lastProjectId).then((s) => {
      if (!cancelled) setSuggestions(s)
    })
    return () => { cancelled = true }
  }, [lastPage, lastProjectId])

  return { suggestions, setSuggestions }
}
