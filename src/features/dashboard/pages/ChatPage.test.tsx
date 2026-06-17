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
vi.mock('@/services/aiService', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
}))

import ChatPage from './ChatPage'

// Radix Select relies on pointer-capture + scrollIntoView which jsdom lacks.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
})

beforeEach(() => {
  sendChatMessage.mockReset()
  sendChatMessage.mockResolvedValue({
    message: 'ok', tool_calls: [], model: 'groq:test', steps: 1,
  })
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

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1))
    expect(sendChatMessage).toHaveBeenCalledWith('hello', undefined, [])
  })

  it('scopes the message to the selected project', async () => {
    const user = userEvent.setup()
    render(<ChatPage />)

    await user.click(screen.getByRole('combobox', { name: /project/i }))
    await user.click(await screen.findByRole('option', { name: 'Web App' }))

    await user.type(screen.getByPlaceholderText(/ask about/i), 'whats open?')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1))
    expect(sendChatMessage).toHaveBeenCalledWith('whats open?', 'p-1', [])
  })

  it('replays prior turns as history on the next message', async () => {
    const user = userEvent.setup()
    render(<ChatPage />)

    const box = screen.getByPlaceholderText(/ask about/i)
    await user.type(box, 'first')
    await user.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1))
    // First turn carries no history (welcome message is excluded).
    expect(sendChatMessage).toHaveBeenLastCalledWith('first', undefined, [])

    // Wait for the assistant reply to land before the next turn.
    await screen.findByText('ok')

    await user.type(box, 'second')
    await user.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2))
    expect(sendChatMessage).toHaveBeenLastCalledWith('second', undefined, [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'ok' },
    ])
  })
})
