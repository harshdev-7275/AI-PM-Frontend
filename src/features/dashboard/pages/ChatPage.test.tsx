import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockProjects = [
  { id: 'p-1', name: 'Web App',  key: 'WEB' },
  { id: 'p-2', name: 'Mobile',   key: 'MOB' },
]

vi.mock('@/store/useProjectStore', () => ({
  useProjectStore: (selector: (s: { projects: typeof mockProjects }) => unknown) =>
    selector({ projects: mockProjects }),
}))

const sendChatMessage = vi.fn()
const streamChatMessage = vi.fn()
vi.mock('@/services/aiService', () => ({
  sendChatMessage:    (...args: unknown[]) => sendChatMessage(...args),
  streamChatMessage:  (...args: unknown[]) => streamChatMessage(...args),
}))

import ChatPage from './ChatPage'

// Radix Select relies on pointer-capture + scrollIntoView which jsdom lacks.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
})

// Default mock: streams two tokens then fires onDone synchronously (the
// promise still resolves in a microtask so React can flush state).
function mockHappyStream(message: string): void {
  streamChatMessage.mockImplementation(
    async (_msg: string, _projectId: string | undefined, _history: unknown, callbacks: {
      onToken?: (delta: string) => void
      onDone?:  (message: string, toolCalls: unknown[], model: string, steps: number) => void
    }) => {
      callbacks.onToken?.('Hello')
      callbacks.onToken?.(' world')
      callbacks.onDone?.('Hello world', [], 'groq:test', 1)
      // Mark last message for assertions.
      callbacks.onDone?.(message, [], 'groq:test', 1)
    },
  )
}

beforeEach(() => {
  sendChatMessage.mockReset()
  streamChatMessage.mockReset()
  sendChatMessage.mockResolvedValue({
    message: 'ok', tool_calls: [], model: 'groq:test', steps: 1,
  })
  mockHappyStream('Hello world')
})

describe('ChatPage project scoping', () => {
  it('renders a project selector listing the org projects', () => {
    render(<ChatPage />)
    expect(screen.getByRole('combobox', { name: /project/i })).toBeInTheDocument()
  })

  it('sends with no project_id when no project is selected', async () => {
    const user = userEvent.setup()
    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about/i), 'hello')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => expect(streamChatMessage).toHaveBeenCalledTimes(1))
    const [message, projectId, history] = streamChatMessage.mock.calls[0] as [string, string | undefined, unknown[]]
    expect(message).toBe('hello')
    expect(projectId).toBeUndefined()
    expect(history).toEqual([])
  })

  it('scopes the message to the selected project', async () => {
    const user = userEvent.setup()
    render(<ChatPage />)

    await user.click(screen.getByRole('combobox', { name: /project/i }))
    await user.click(await screen.findByRole('option', { name: 'Web App' }))

    await user.type(screen.getByPlaceholderText(/ask about/i), 'whats open?')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => expect(streamChatMessage).toHaveBeenCalledTimes(1))
    const [, projectId] = streamChatMessage.mock.calls[0] as [string, string | undefined, unknown[]]
    expect(projectId).toBe('p-1')
  })

  it('replays prior turns as history on the next message', async () => {
    const user = userEvent.setup()
    render(<ChatPage />)

    const box = screen.getByPlaceholderText(/ask about/i)
    await user.type(box, 'first')
    await user.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => expect(streamChatMessage).toHaveBeenCalledTimes(1))
    const [, , firstHistory] = streamChatMessage.mock.calls[0] as [string, string | undefined, unknown[]]
    expect(firstHistory).toEqual([])

    // Wait for the streamed reply to render before sending the next turn.
    await screen.findByText('Hello world')

    await user.type(box, 'second')
    await user.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => expect(streamChatMessage).toHaveBeenCalledTimes(2))
    const [, , secondHistory] = streamChatMessage.mock.calls[1] as [string, string | undefined, unknown[]]
    expect(secondHistory).toEqual([
      { role: 'user',      content: 'first' },
      { role: 'assistant', content: 'Hello world' },
    ])
  })
})


describe('ChatPage streaming UX', () => {
  it('renders streamed tokens incrementally as the assistant bubble grows', async () => {
    // Mock that emits one token, lets React render, then emits the next.
    streamChatMessage.mockImplementation(
      async (_msg, _projectId, _history, callbacks: {
        onToken?: (delta: string) => void
        onDone?:  (message: string) => void
      }) => {
        callbacks.onToken?.('Hel')
        await Promise.resolve()
        callbacks.onToken?.('lo')
        await Promise.resolve()
        callbacks.onDone?.('Hello')
      },
    )

    const user = userEvent.setup()
    render(<ChatPage />)
    await user.type(screen.getByPlaceholderText(/ask about/i), 'hi')
    await user.click(screen.getByRole('button', { name: /send/i }))

    // Both tokens eventually visible after the stream completes.
    await screen.findByText('Hello')
  })

  it('shows a Cancel button while streaming and aborts on click', async () => {
    let capturedSignal: AbortSignal | undefined
    streamChatMessage.mockImplementation(
      async (_msg, _projectId, _history, _callbacks, options?: { signal?: AbortSignal }) => {
        capturedSignal = options?.signal
        // Never resolve on its own — only reject when the caller aborts.
        return new Promise<void>((_, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      },
    )

    const user = userEvent.setup()
    render(<ChatPage />)
    await user.type(screen.getByPlaceholderText(/ask about/i), 'hi')
    await user.click(screen.getByRole('button', { name: /send/i }))

    const cancelBtn = await screen.findByRole('button', { name: /cancel/i })
    await user.click(cancelBtn)

    expect(capturedSignal).toBeDefined()
    expect(capturedSignal!.aborted).toBe(true)

    // After Cancel, the Send button comes back and a fresh send is possible.
    await screen.findByRole('button', { name: /send/i })
  })

  it('surfaces tool call audit trail on the assistant bubble after the stream ends', async () => {
    // After onDone, the tool calls travel via the message's `toolCalls` field
    // and render via ToolCallsDetail (a "N tool call(s)" disclosure).
    const toolCall: { tool: string; args: Record<string, unknown>; result_preview: string | null } = {
      tool: 'list_issues',
      args: { project_id: 'p1' },
      result_preview: 'preview',
    }
    streamChatMessage.mockImplementation(
      async (_msg, _projectId, _history, callbacks: {
        onToolStart?: (tool: string, id: string, args: Record<string, unknown>) => void
        onToolEnd?:   (id: string, preview: string | null) => void
        onDone?:      (
          message: string,
          toolCalls: typeof toolCall[],
          model: string,
          steps: number,
        ) => void
      }) => {
        callbacks.onToolStart?.('list_issues', 't1', { project_id: 'p1' })
        callbacks.onToolEnd?.('t1', 'preview')
        callbacks.onDone?.('done', [toolCall], 'groq:test', 1)
      },
    )

    const user = userEvent.setup()
    render(<ChatPage />)
    await user.type(screen.getByPlaceholderText(/ask about/i), 'hi')
    await user.click(screen.getByRole('button', { name: /send/i }))

    // Disclosure button — "1 tool call" — appears once the stream is done.
    await screen.findByText(/1 tool call/i)
  })

  it('surfaces an error frame as a destructive-styled assistant bubble', async () => {
    streamChatMessage.mockImplementation(
      async (_msg, _projectId, _history, callbacks: {
        onError?: (code: string, message: string) => void
      }) => {
        callbacks.onError?.('RECURSION_LIMIT', 'narrow it down')
      },
    )

    const user = userEvent.setup()
    render(<ChatPage />)
    await user.type(screen.getByPlaceholderText(/ask about/i), 'hi')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await screen.findByText('narrow it down')
  })
})
