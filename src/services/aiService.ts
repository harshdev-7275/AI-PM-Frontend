import { env } from '@/lib/env'
import { useAuthStore } from '@/store/useAuthStore'

export interface ToolCallRecord {
  tool:           string
  args:           Record<string, unknown>
  result_preview: string | null
}

export interface ChatResponse {
  message:    string
  tool_calls: ToolCallRecord[]
  model:      string
  steps:      number
}

export async function sendChatMessage(
  message: string,
  projectId?: string,
): Promise<ChatResponse> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(`${env.VITE_AI_SERVICE_URL}/v1/chat`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, ...(projectId ? { project_id: projectId } : {}) }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? `AI service error ${res.status}`)
  }

  return res.json() as Promise<ChatResponse>
}
