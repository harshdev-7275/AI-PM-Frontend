import { api } from '@/services/api'

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

// Chat goes through node-backend (the BFF), which proxies to the private
// ai-service over a trusted server-to-server channel. The shared `api` client
// attaches the user's access token and handles 401 refresh automatically.
export async function sendChatMessage(
  message: string,
  projectId?: string,
): Promise<ChatResponse> {
  const res = await api.post('/ai/chat', {
    message,
    ...(projectId ? { projectId } : {}),
  })
  return res.data as ChatResponse
}
