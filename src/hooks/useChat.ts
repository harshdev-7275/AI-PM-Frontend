import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'
import { useChatStore, type ChatMessage } from '@/store/useChatStore'
import { sendChatMessage } from '@/services/api'

export function useChat() {
  const { messages, isLoading, currentProjectId, addMessage, setLoading, setProjectId, clearMessages } =
    useChatStore()

  const sendMessage = async (text: string): Promise<void> => {
    const user = useAuthStore.getState().user
    const currentOrg = useOrgStore.getState().currentOrg

    if (!user || !currentOrg || !currentProjectId) return

    addMessage({ role: 'user', content: text })
    setLoading(true)

    try {
      const response = await sendChatMessage(text, user.id, currentOrg.slug, currentProjectId)
      const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
        role:    'assistant',
        content: response.result?.message ?? response.error ?? 'No response',
      }
      if (response.intent) {
        message.intent = response.intent
      }
      if (response.status) {
        message.status = response.status
      }
      addMessage(message)
    } catch (err) {
      // The Zod schema in services/api.ts is the AI service's contract. If a
      // new status value is added on the Python side without updating the
      // enum, parse() throws and the user would see an empty chat. Surface
      // a generic error message so the failure is at least visible.
      // Logged for ops visibility.
      // eslint-disable-next-line no-console
      console.error('chat: failed to parse AI response', err)
      addMessage({
        role:    'assistant',
        content: 'Sorry, the AI service returned an unexpected response. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const setProject = (projectId: string): void => {
    setProjectId(projectId)
  }

  return { messages, isLoading, sendMessage, setProject, clearMessages }
}
