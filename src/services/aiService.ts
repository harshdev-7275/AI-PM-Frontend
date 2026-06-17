import { api } from '@/services/api'

// The agent runs multiple LLM + tool-calling round-trips, so a single chat turn
// can take far longer than the default 10s global timeout. Give it 70s
// (10s default + 1 min) via a per-request override so other endpoints keep the
// snappy default.
const CHAT_TIMEOUT_MS = 70_000

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
  }, {
    timeout: CHAT_TIMEOUT_MS,
  })
  return res.data as ChatResponse
}
