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
      addMessage(message)
    } finally {
      setLoading(false)
    }
  }

  const setProject = (projectId: string): void => {
    setProjectId(projectId)
  }

  return { messages, isLoading, sendMessage, setProject, clearMessages }
}
