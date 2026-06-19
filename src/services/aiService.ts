import { env } from '@/lib/env'
import { useAuthStore } from '@/store/useAuthStore'
import { refreshToken } from './api'

// The agent runs multiple LLM + tool-calling round-trips, so a single chat turn
// can take far longer than the default 10s global timeout. The BFF /ai/chat/stream
// proxies the upstream ai-service stream, which has its own timeout; we don't
// cap the fetch from the browser because the user can cancel manually.
const CHAT_TIMEOUT_MS = 70_000

export interface ToolCallRecord {
  tool:           string
  args:           Record<string, unknown>
  result_preview: string | null
}

// A prior conversation turn replayed to the backend so the agent has multi-turn
// context (the chat endpoint itself is stateless).
export interface ChatTurn {
  role:    'user' | 'assistant'
  content: string
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
  history: ChatTurn[] = [],
): Promise<ChatResponse> {
  const res = await fetch(`${env.VITE_API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
    },
    body: JSON.stringify({
      message,
      ...(projectId ? { projectId } : {}),
      ...(history.length ? { history } : {}),
    }),
    // Localtimeout for the non-streaming chat — fast model responses shouldn't
    // hang indefinitely. Streaming has its own cancel path.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AbortSignal.timeout is ES2024; lib target doesn't include it
    signal: (AbortSignal as any).timeout?.(CHAT_TIMEOUT_MS),
  })
  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status}`)
  }
  return (await res.json()) as ChatResponse
}

// =============================================================================
// Streaming
// =============================================================================

export interface StreamCallbacks {
  onToken?:     (delta: string) => void
  onToolStart?: (tool: string, toolCallId: string, args: Record<string, unknown>) => void
  onToolEnd?:   (toolCallId: string, resultPreview: string | null) => void
  onDone?:      (message: string, toolCalls: ToolCallRecord[], model: string, steps: number) => void
  onError?:     (code: string, message: string) => void
}

export interface StreamOptions {
  /** When aborted, the upstream fetch is cancelled — works through to ai-service. */
  signal?: AbortSignal
}

interface StreamEvent {
  type:          string
  delta?:        string
  tool?:         string
  tool_call_id?: string
  args?:         Record<string, unknown>
  result_preview?: string | null
  message?:      string
  tool_calls?:   ToolCallRecord[]
  model?:        string
  steps?:        number
  code?:         string
}

/**
 * Parse one SSE frame (the text between two `\n\n` boundaries, or the tail of
 * the buffer) into the JSON payload object, or `null` if the frame is empty
 * or malformed. The `data:` prefix is the only field consumed; comments (`:…`)
 * are ignored, matching the SSE spec.
 */
function parseSseFrame(frame: string): StreamEvent | null {
  for (const line of frame.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(':')) continue
    if (trimmed.startsWith('data:')) {
      const payload = trimmed.slice(5).trim()
      if (!payload) continue
      try {
        return JSON.parse(payload) as StreamEvent
      } catch {
        return null
      }
    }
  }
  return null
}

function dispatchEvent(event: StreamEvent, callbacks: StreamCallbacks): void {
  switch (event.type) {
    case 'token':
      if (callbacks.onToken && typeof event.delta === 'string') {
        callbacks.onToken(event.delta)
      }
      break
    case 'tool_start':
      if (callbacks.onToolStart && event.tool && event.tool_call_id) {
        callbacks.onToolStart(event.tool, event.tool_call_id, event.args ?? {})
      }
      break
    case 'tool_end':
      if (callbacks.onToolEnd && event.tool_call_id) {
        callbacks.onToolEnd(event.tool_call_id, event.result_preview ?? null)
      }
      break
    case 'done':
      if (callbacks.onDone) {
        callbacks.onDone(
          event.message ?? '',
          event.tool_calls ?? [],
          event.model ?? '',
          event.steps ?? 0,
        )
      }
      break
    case 'error':
      if (callbacks.onError && event.code) {
        callbacks.onError(event.code, event.message ?? '')
      }
      break
  }
}

/**
 * Stream a chat turn as Server-Sent Events from the BFF (which proxies the
 * ai-service stream). The caller passes lifecycle callbacks; the caller's
 * AbortSignal is threaded through to `fetch` so a UI Cancel button can
 * terminate the upstream request immediately.
 *
 * 401 handling mirrors the axios interceptor in `api.ts`: a single
 * `refreshToken()` + retry. Concurrent calls are not de-duplicated here —
 * streamChatMessage is invoked once per user turn, so the chance of a
 * collision is minimal.
 */
export async function streamChatMessage(
  message: string,
  projectId?: string,
  history: ChatTurn[] = [],
  callbacks: StreamCallbacks = {},
  options: StreamOptions = {},
): Promise<void> {
  const doFetch = (token: string | null) =>
    fetch(`${env.VITE_API_BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        ...(projectId ? { projectId } : {}),
        ...(history.length ? { history } : {}),
      }),
      signal: options.signal,
    })

  const initialToken = useAuthStore.getState().accessToken
  let res = await doFetch(initialToken)

  if (res.status === 401) {
    const { accessToken } = await refreshToken()
    useAuthStore.getState().setAccessToken(accessToken)
    res = await doFetch(accessToken)
  }

  if (!res.ok) {
    throw new Error(`Stream request failed: ${res.status}`)
  }
  if (!res.body) {
    throw new Error('Stream response has no body')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Drain complete frames (separated by blank line per SSE spec).
      let frameEnd = buffer.indexOf('\n\n')
      while (frameEnd !== -1) {
        const frame = buffer.slice(0, frameEnd)
        buffer = buffer.slice(frameEnd + 2)
        const event = parseSseFrame(frame)
        if (event) dispatchEvent(event, callbacks)
        frameEnd = buffer.indexOf('\n\n')
      }
    }
    // Flush any trailing partial frame (no terminating \n\n).
    const tail = buffer.trim()
    if (tail) {
      const event = parseSseFrame(tail)
      if (event) dispatchEvent(event, callbacks)
    }
  } finally {
    try { reader.releaseLock() } catch { /* already released */ }
  }
}
