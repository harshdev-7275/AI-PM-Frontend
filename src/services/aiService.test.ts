import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { streamChatMessage } from './aiService'

// vi.mock factories are hoisted above all imports, so anything they reference
// must live in vi.hoisted() (or be declared inline). This is also where we
// define the mock access token + refresh fn the tests poke.
const { getState, setAccessToken, mockRefreshToken } = vi.hoisted(() => {
  const setAccessToken = vi.fn()
  const getState = vi.fn(() => ({
    user: null,
    accessToken: 'test-token',
    isLoading: false,
    isAuthenticated: true,
    setAuth: vi.fn(),
    setAccessToken,
    clearAuth: vi.fn(),
  }))
  const mockRefreshToken = vi.fn()
  return { getState, setAccessToken, mockRefreshToken }
})

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: { getState: (...args: unknown[]) => getState(...args) },
}))

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return { ...actual, refreshToken: mockRefreshToken }
})

// ---------- helpers --------------------------------------------------------

const encoder = new TextEncoder()

function streamResponse(chunks: string[], init: { status?: number; headers?: HeadersInit } = {}): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return new Response(body, {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'text/event-stream', ...(init.headers ?? {}) },
  })
}

function parseInitBody(init: RequestInit | undefined): Record<string, unknown> {
  return JSON.parse(init?.body as string)
}

// ---------- tests ----------------------------------------------------------

beforeEach(() => {
  setAccessToken.mockClear()
  mockRefreshToken.mockReset()
  getState.mockClear()
  getState.mockReturnValue({
    user: null,
    accessToken: 'test-token',
    isLoading: false,
    isAuthenticated: true,
    setAuth: vi.fn(),
    setAccessToken,
    clearAuth: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('streamChatMessage', () => {
  it('POSTs to /ai/chat/stream with the access token and body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await streamChatMessage('hello', 'p-1', [{ role: 'user', content: 'prev' }])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://localhost:4000/ai/chat/stream')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token')
    const body = parseInitBody(init)
    expect(body.message).toBe('hello')
    expect(body.projectId).toBe('p-1')
    expect(body.history).toEqual([{ role: 'user', content: 'prev' }])
  })

  it('omits projectId and history when not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await streamChatMessage('hi')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = parseInitBody(init)
    expect(body.message).toBe('hi')
    expect('projectId' in body).toBe(false)
    expect('history' in body).toBe(false)
  })

  it('surfaces token, tool_start, tool_end, and done callbacks from SSE frames', async () => {
    const sse =
      'data: {"type":"token","delta":"hel"}\n\n' +
      'data: {"type":"token","delta":"lo"}\n\n' +
      'data: {"type":"tool_start","tool":"list_issues","tool_call_id":"t1","args":{"x":1}}\n\n' +
      'data: {"type":"tool_end","tool_call_id":"t1","result_preview":"result"}\n\n' +
      'data: {"type":"done","message":"hello","tool_calls":[],"model":"m","steps":1}\n\n'
    const fetchMock = vi.fn().mockResolvedValue(streamResponse([sse]))
    vi.stubGlobal('fetch', fetchMock)

    const tokens: string[] = []
    const toolStarts: Array<{ tool: string; id: string; args: Record<string, unknown> }> = []
    const toolEnds: Array<{ id: string; preview: string | null }> = []
    let done: { message: string; model: string; steps: number } | null = null

    await streamChatMessage('hi', undefined, [], {
      onToken: (delta) => tokens.push(delta),
      onToolStart: (tool, id, args) => toolStarts.push({ tool, id, args }),
      onToolEnd: (id, preview) => toolEnds.push({ id, preview }),
      onDone: (message, _calls, model, steps) => {
        done = { message, model, steps }
      },
    })

    expect(tokens).toEqual(['hel', 'lo'])
    expect(toolStarts).toEqual([{ tool: 'list_issues', id: 't1', args: { x: 1 } }])
    expect(toolEnds).toEqual([{ id: 't1', preview: 'result' }])
    expect(done).toEqual({ message: 'hello', model: 'm', steps: 1 })
  })

  it('assembles frames split across multiple network chunks', async () => {
    // A single frame can straddle two read() calls — the parser must buffer.
    const fetchMock = vi.fn().mockResolvedValue(
      streamResponse([
        'data: {"type":"token","delta":"hel',
        'lo"}\n\ndata: {"type":"done","message":"hello","tool_calls":[],"model":"m","steps":1}\n\n',
      ]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const tokens: string[] = []
    let doneMsg = ''
    await streamChatMessage('hi', undefined, [], {
      onToken: (d) => tokens.push(d),
      onDone: (m) => { doneMsg = m },
    })

    expect(tokens).toEqual(['hello'])
    expect(doneMsg).toBe('hello')
  })

  it('surfaces error frames via onError', async () => {
    const sse = 'data: {"type":"error","code":"RECURSION_LIMIT","message":"loop"}\n\n'
    const fetchMock = vi.fn().mockResolvedValue(streamResponse([sse]))
    vi.stubGlobal('fetch', fetchMock)

    const errors: Array<{ code: string; message: string }> = []
    await streamChatMessage('hi', undefined, [], {
      onError: (code, message) => errors.push({ code, message }),
    })

    expect(errors).toEqual([{ code: 'RECURSION_LIMIT', message: 'loop' }])
  })

  it('refreshes the access token and retries once on 401', async () => {
    mockRefreshToken.mockResolvedValue({ accessToken: 'new-token', expiresIn: 900 })

    let call = 0
    const fetchMock = vi.fn().mockImplementation(async () => {
      call++
      if (call === 1) {
        return new Response('{"error":"UNAUTHORIZED"}', { status: 401 })
      }
      return streamResponse([
        'data: {"type":"done","message":"retry ok","tool_calls":[],"model":"m","steps":1}\n\n',
      ])
    })
    vi.stubGlobal('fetch', fetchMock)

    let doneMsg = ''
    await streamChatMessage('hi', undefined, [], {
      onDone: (m) => { doneMsg = m },
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(setAccessToken).toHaveBeenCalledWith('new-token')

    // First call used the old token; second used the new one.
    const firstInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    const secondInit = fetchMock.mock.calls[1]?.[1] as RequestInit
    expect((firstInit.headers as Record<string, string>).Authorization).toBe('Bearer test-token')
    expect((secondInit.headers as Record<string, string>).Authorization).toBe('Bearer new-token')

    expect(doneMsg).toBe('retry ok')
  })

  it('throws after the 401-retry still returns 401', async () => {
    mockRefreshToken.mockResolvedValue({ accessToken: 'new-token', expiresIn: 900 })
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"error":"UNAUTHORIZED"}', { status: 401 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(streamChatMessage('hi')).rejects.toThrow(/401/)
  })

  it('aborts the upstream fetch when the signal is aborted', async () => {
    let capturedSignal: AbortSignal | undefined
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      capturedSignal = init.signal as AbortSignal
      return new Promise<Response>((_, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        })
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const ac = new AbortController()
    const promise = streamChatMessage('hi', undefined, [], {}, { signal: ac.signal })
    ac.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(capturedSignal).toBeDefined()
    expect(capturedSignal!.aborted).toBe(true)
  })
})
