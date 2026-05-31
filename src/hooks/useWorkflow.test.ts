import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import { mockWorkflowStatus } from '../../test/mocks/handlers'
import { useWorkflow } from './useWorkflow'

const SLUG       = 'test-org'
const PROJECT_ID = 'cccccccc-0000-4000-8000-000000000001'
const STATUS_ID  = mockWorkflowStatus.id

// A second status used for multi-status scenarios (reorder, delete)
const secondStatus = {
  ...mockWorkflowStatus,
  id:        'bbbbbbbb-0000-4000-8000-000000000002',
  name:      'In Progress',
  color:     '#3b82f6',
  position:  2,
  isDefault: false,
}

// =============================================================================
// loadStatuses
// =============================================================================

describe('loadStatuses', () => {
  it('populates statuses from the API response', async () => {
    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.loadStatuses()
    })

    expect(result.current.statuses).toHaveLength(1)
    expect(result.current.statuses[0]?.id).toBe(mockWorkflowStatus.id)
    expect(result.current.statuses[0]?.name).toBe(mockWorkflowStatus.name)
    expect(result.current.statuses[0]?.isDefault).toBe(mockWorkflowStatus.isDefault)
  })

  it('isLoading is false after a successful load', async () => {
    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.loadStatuses()
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('isLoading is false after a failed load', async () => {
    server.use(
      http.get('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () =>
        HttpResponse.json({ error: 'ORG_NOT_FOUND' }, { status: 404 })
      )
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.loadStatuses()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.statuses).toHaveLength(0)
  })
})

// =============================================================================
// handleCreate
// =============================================================================

describe('handleCreate', () => {
  it('appends the new status to the end of the array', async () => {
    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => { await result.current.loadStatuses() })
    expect(result.current.statuses).toHaveLength(1)

    await act(async () => {
      await result.current.handleCreate('QA Testing', '#8b5cf6')
    })

    expect(result.current.statuses).toHaveLength(2)
    expect(result.current.statuses[1]?.name).toBe('QA Testing')
    expect(result.current.statuses[1]?.color).toBe('#8b5cf6')
    expect(result.current.statuses[1]?.position).toBe(6)
  })

  it('isSaving is false after creation succeeds', async () => {
    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.handleCreate('QA Testing', '#8b5cf6')
    })

    expect(result.current.isSaving).toBe(false)
  })

  it('isSaving is false and re-throws when the API fails', async () => {
    server.use(
      http.post('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () =>
        HttpResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      )
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    // Catch inside act so React can flush state updates before we assert isSaving
    let threw = false
    await act(async () => {
      try { await result.current.handleCreate('Bad', '#000000') }
      catch { threw = true }
    })

    expect(threw).toBe(true)
    expect(result.current.isSaving).toBe(false)
  })
})

// =============================================================================
// handleRename
// =============================================================================

describe('handleRename', () => {
  it('updates the status name in memory without a refetch', async () => {
    let getCalls = 0
    server.use(
      http.get('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () => {
        getCalls++
        return HttpResponse.json([mockWorkflowStatus])
      })
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))
    await act(async () => { await result.current.loadStatuses() })
    const callsAfterLoad = getCalls

    await act(async () => {
      await result.current.handleRename(STATUS_ID, 'In Development')
    })

    const renamed = result.current.statuses.find((s) => s.id === STATUS_ID)
    expect(renamed?.name).toBe('In Development')
    expect(getCalls).toBe(callsAfterLoad)  // no extra GET
  })

  it('isSaving is false after rename succeeds', async () => {
    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.handleRename(STATUS_ID, 'New Name')
    })

    expect(result.current.isSaving).toBe(false)
  })
})

// =============================================================================
// handleRecolor
// =============================================================================

describe('handleRecolor', () => {
  it('updates the status color in memory without a refetch', async () => {
    server.use(
      http.patch('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ ...mockWorkflowStatus, color: '#0ea5e9' })
      )
    )

    let getCalls = 0
    server.use(
      http.get('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () => {
        getCalls++
        return HttpResponse.json([mockWorkflowStatus])
      })
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))
    await act(async () => { await result.current.loadStatuses() })
    const callsAfterLoad = getCalls

    await act(async () => {
      await result.current.handleRecolor(STATUS_ID, '#0ea5e9')
    })

    const recolored = result.current.statuses.find((s) => s.id === STATUS_ID)
    expect(recolored?.color).toBe('#0ea5e9')
    expect(getCalls).toBe(callsAfterLoad)  // no extra GET
  })

  it('isSaving is false after recolor succeeds', async () => {
    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.handleRecolor(STATUS_ID, '#0ea5e9')
    })

    expect(result.current.isSaving).toBe(false)
  })
})

// =============================================================================
// handleReorder
// =============================================================================

describe('handleReorder', () => {
  it('refetches the full list after reorder so shifted siblings are accurate', async () => {
    const reordered = [secondStatus, mockWorkflowStatus].map((s, i) => ({ ...s, position: i + 1 }))
    let getCalls = 0

    server.use(
      http.get('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () => {
        getCalls++
        return getCalls === 1
          ? HttpResponse.json([mockWorkflowStatus, secondStatus])
          : HttpResponse.json(reordered)
      }),
      http.patch('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ ...secondStatus, position: 1 })
      )
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))
    await act(async () => { await result.current.loadStatuses() })

    await act(async () => {
      await result.current.handleReorder(secondStatus.id, 1)
    })

    expect(getCalls).toBe(2)  // initial load + refetch
    expect(result.current.statuses[0]?.id).toBe(secondStatus.id)
    expect(result.current.statuses[0]?.position).toBe(1)
  })

  it('isSaving is false after reorder succeeds', async () => {
    server.use(
      http.patch('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ ...mockWorkflowStatus, position: 2 })
      )
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.handleReorder(STATUS_ID, 2)
    })

    expect(result.current.isSaving).toBe(false)
  })
})

// =============================================================================
// handleDelete
// =============================================================================

describe('handleDelete', () => {
  it('removes the status from the array and returns undefined on success', async () => {
    server.use(
      http.get('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () =>
        HttpResponse.json([mockWorkflowStatus, secondStatus])
      )
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))
    await act(async () => { await result.current.loadStatuses() })
    expect(result.current.statuses).toHaveLength(2)

    let returnValue: Awaited<ReturnType<typeof result.current.handleDelete>>
    await act(async () => {
      returnValue = await result.current.handleDelete(secondStatus.id)
    })

    expect(returnValue).toBeUndefined()
    expect(result.current.statuses).toHaveLength(1)
    expect(result.current.statuses.find((s) => s.id === secondStatus.id)).toBeUndefined()
  })

  it('returns { issueCount } instead of throwing when STATUS_HAS_ISSUES (409)', async () => {
    server.use(
      http.delete('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json(
          { error: 'STATUS_HAS_ISSUES', message: 'Move issues first', issueCount: 3 },
          { status: 409 },
        )
      ),
      http.get('http://localhost:4000/orgs/:slug/projects/:projectId/statuses', () =>
        HttpResponse.json([mockWorkflowStatus, secondStatus])
      )
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))
    await act(async () => { await result.current.loadStatuses() })

    let returnValue: Awaited<ReturnType<typeof result.current.handleDelete>>
    await act(async () => {
      returnValue = await result.current.handleDelete(STATUS_ID)
    })

    expect(returnValue).toEqual({ issueCount: 3 })
    // Status must remain in the array — not deleted
    expect(result.current.statuses.find((s) => s.id === STATUS_ID)).toBeDefined()
  })

  it('isSaving is false after STATUS_HAS_ISSUES', async () => {
    server.use(
      http.delete('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json(
          { error: 'STATUS_HAS_ISSUES', issueCount: 1 },
          { status: 409 },
        )
      )
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.handleDelete(STATUS_ID)
    })

    expect(result.current.isSaving).toBe(false)
  })

  it('isSaving is false after a successful delete', async () => {
    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    await act(async () => {
      await result.current.handleDelete(STATUS_ID)
    })

    expect(result.current.isSaving).toBe(false)
  })

  it('re-throws other errors (e.g. 400 LAST_STATUS) without absorbing them', async () => {
    server.use(
      http.delete('http://localhost:4000/orgs/:slug/projects/:projectId/statuses/:statusId', () =>
        HttpResponse.json({ error: 'LAST_STATUS' }, { status: 400 })
      )
    )

    const { result } = renderHook(() => useWorkflow(SLUG, PROJECT_ID))

    let threw = false
    await act(async () => {
      try { await result.current.handleDelete(STATUS_ID) }
      catch { threw = true }
    })

    expect(threw).toBe(true)
    expect(result.current.isSaving).toBe(false)
  })
})
