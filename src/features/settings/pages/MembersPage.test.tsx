import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../../../test/mocks/server'
import { mockUser, mockOrgMember, mockInvitation } from '../../../../test/mocks/handlers'
import { useAuthStore } from '@/store/useAuthStore'
import MembersPage from './MembersPage'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ownerMember = { ...mockOrgMember, role: 'owner'  as const }
const adminMember = { ...mockOrgMember, role: 'admin'  as const }
const plainMember = { ...mockOrgMember, role: 'member' as const }

// A second user — distinct userId so "self" checks don't fire
const otherMember = {
  id:        'bbbbbbbb-0000-4000-8000-000000000002',
  userId:    'dddddddd-0000-4000-8000-000000000001',
  name:      'Other User',
  email:     'other@example.com',
  avatarUrl: null as string | null,
  role:      'member' as const,
  joinedAt:  '2026-01-01T00:00:00.000Z',
}

const SLUG = 'test-org'

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderMembersPage() {
  return render(
    <MemoryRouter initialEntries={[`/${SLUG}/settings/members`]}>
      <Routes>
        <Route path="/:slug/settings/members" element={<MembersPage />} />
      </Routes>
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAuthStore.setState({
    user:            mockUser,
    accessToken:     'mock-access-token',
    isLoading:       false,
    isAuthenticated: true,
  })
  // Default: current user is the org owner
  server.use(
    http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
      HttpResponse.json([ownerMember])
    )
  )
})

afterEach(() => {
  vi.useRealTimers()
})

// =============================================================================
// LOADING STATE
// =============================================================================

describe('loading state', () => {
  it('shows 3 skeleton rows while members are loading', () => {
    renderMembersPage()
    // isLoading is set to true synchronously before the first await in loadMembers,
    // so skeletons are visible immediately after mount.
    expect(screen.getAllByRole('status')).toHaveLength(3)
  })
})

// =============================================================================
// MEMBER LIST
// =============================================================================

describe('member list', () => {
  it('shows "Members (1)" heading after loading', async () => {
    renderMembersPage()
    expect(await screen.findByRole('heading', { name: /members \(1\)/i })).toBeInTheDocument()
  })

  it('shows member name and email', async () => {
    renderMembersPage()
    expect(await screen.findByText(ownerMember.name)).toBeInTheDocument()
    expect(screen.getByText(ownerMember.email)).toBeInTheDocument()
  })

  it('shows "Owner" badge for owner role', async () => {
    renderMembersPage()
    await screen.findByText(ownerMember.name)
    expect(screen.getByText('Owner')).toBeInTheDocument()
  })

  it('shows "Admin" badge for admin role', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([adminMember])
      )
    )
    renderMembersPage()
    await screen.findByText(adminMember.name)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows "Member" badge for member role', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([plainMember])
      )
    )
    renderMembersPage()
    await screen.findByText(plainMember.name)
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('shows initials avatar for a member', async () => {
    renderMembersPage()
    await screen.findByText(ownerMember.name)
    // First two letters of "Test User" → "TE"
    expect(screen.getByText('TE')).toBeInTheDocument()
  })
})

// =============================================================================
// INVITE SECTION VISIBILITY
// =============================================================================

describe('invite section', () => {
  it('is visible when the current user is an owner', async () => {
    renderMembersPage()
    await screen.findByText(ownerMember.name)
    expect(screen.getByRole('heading', { name: /invite people/i })).toBeInTheDocument()
  })

  it('is visible when the current user is an admin', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([adminMember])
      )
    )
    renderMembersPage()
    await screen.findByText(adminMember.name)
    expect(screen.getByRole('heading', { name: /invite people/i })).toBeInTheDocument()
  })

  it('is hidden when the current user is a plain member', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([plainMember])
      )
    )
    renderMembersPage()
    await screen.findByText(plainMember.name)
    expect(screen.queryByRole('heading', { name: /invite people/i })).not.toBeInTheDocument()
  })

  it('renders an email input and role dropdown', async () => {
    renderMembersPage()
    await screen.findByText(ownerMember.name)
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /invite as/i })).toBeInTheDocument()
  })

  it('"Send invite" button is disabled and shows "Sending…" while the call is in flight', async () => {
    server.use(
      http.post(`http://localhost:4000/orgs/${SLUG}/invite`, async () => {
        await new Promise((r) => setTimeout(r, 300))
        return HttpResponse.json(mockInvitation, { status: 201 })
      })
    )
    const user = userEvent.setup()
    renderMembersPage()
    await screen.findByText(ownerMember.name)

    await user.type(screen.getByPlaceholderText(/email address/i), 'new@example.com')
    await user.click(screen.getByRole('button', { name: /send invite/i }))

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
  })

  it('shows green success banner with the invited email on success', async () => {
    const user = userEvent.setup()
    renderMembersPage()
    await screen.findByText(ownerMember.name)

    await user.type(screen.getByPlaceholderText(/email address/i), mockInvitation.email)
    await user.click(screen.getByRole('button', { name: /send invite/i }))

    expect(
      await screen.findByText(new RegExp(`invite sent to ${mockInvitation.email}`, 'i'))
    ).toBeInTheDocument()
  })

  it('clears the email input after a successful invite', async () => {
    const user = userEvent.setup()
    renderMembersPage()
    await screen.findByText(ownerMember.name)

    const input = screen.getByPlaceholderText(/email address/i)
    await user.type(input, mockInvitation.email)
    await user.click(screen.getByRole('button', { name: /send invite/i }))

    await screen.findByText(/invite sent to/i)
    expect(input).toHaveValue('')
  })

  it('auto-dismisses the success banner after 3 seconds', async () => {
    // Spy on setTimeout without replacing it — real timers keep working for
    // React internals and waitFor polling; we just capture the dismiss callback.
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    const user = userEvent.setup()
    renderMembersPage()
    await screen.findByText(ownerMember.name)

    await user.type(screen.getByPlaceholderText(/email address/i), mockInvitation.email)
    await user.click(screen.getByRole('button', { name: /send invite/i }))

    await screen.findByText(new RegExp(`invite sent to ${mockInvitation.email}`, 'i'))

    // Find the 3 000 ms dismiss call and fire it synchronously
    const dismissCall = timeoutSpy.mock.calls.find(([, ms]) => ms === 3000)
    act(() => { (dismissCall?.[0] as () => void)() })

    expect(screen.queryByText(/invite sent to/i)).not.toBeInTheDocument()

    timeoutSpy.mockRestore()
  })

  it('shows the error from the hook below the inputs on failure', async () => {
    server.use(
      http.post(`http://localhost:4000/orgs/${SLUG}/invite`, () =>
        HttpResponse.json({ error: 'ALREADY_MEMBER', message: 'Already a member' }, { status: 409 })
      )
    )
    const user = userEvent.setup()
    renderMembersPage()
    await screen.findByText(ownerMember.name)

    await user.type(screen.getByPlaceholderText(/email address/i), 'existing@example.com')
    await user.click(screen.getByRole('button', { name: /send invite/i }))

    expect(await screen.findByText(/this person is already a member/i)).toBeInTheDocument()
  })

  it('shows "Email is required" when submitted with an empty email', async () => {
    const user = userEvent.setup()
    renderMembersPage()
    await screen.findByText(ownerMember.name)

    await user.click(screen.getByRole('button', { name: /send invite/i }))

    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })
})

// =============================================================================
// MEMBER ACTIONS
// =============================================================================

describe('member actions', () => {
  it('owner sees a role dropdown for a non-owner, non-self member', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([ownerMember, otherMember])
      )
    )
    renderMembersPage()
    await screen.findByText(otherMember.name)
    expect(
      screen.getByRole('combobox', { name: new RegExp(`role for ${otherMember.name}`, 'i') })
    ).toBeInTheDocument()
  })

  it('owner does not see a role dropdown for themselves', async () => {
    renderMembersPage()
    await screen.findByText(ownerMember.name)
    expect(
      screen.queryByRole('combobox', { name: new RegExp(`role for ${ownerMember.name}`, 'i') })
    ).not.toBeInTheDocument()
  })

  it('owner does not see a role dropdown for another owner', async () => {
    const otherOwner = { ...otherMember, role: 'owner' as const }
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([ownerMember, otherOwner])
      )
    )
    renderMembersPage()
    await screen.findByText(otherOwner.name)
    expect(
      screen.queryByRole('combobox', { name: new RegExp(`role for ${otherOwner.name}`, 'i') })
    ).not.toBeInTheDocument()
  })

  it('admin does not see a role dropdown for any member', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([adminMember, otherMember])
      )
    )
    renderMembersPage()
    await screen.findByText(otherMember.name)
    // Invite role dropdown exists (admin can invite), but no per-member role dropdown
    expect(
      screen.queryByRole('combobox', { name: new RegExp(`role for ${otherMember.name}`, 'i') })
    ).not.toBeInTheDocument()
  })

  it('owner sees a Remove button for a non-self member', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([ownerMember, otherMember])
      )
    )
    renderMembersPage()
    await screen.findByText(otherMember.name)
    expect(
      screen.getByRole('button', { name: new RegExp(`remove ${otherMember.name}`, 'i') })
    ).toBeInTheDocument()
  })

  it('admin sees a Remove button for a non-self member', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([adminMember, otherMember])
      )
    )
    renderMembersPage()
    await screen.findByText(otherMember.name)
    expect(
      screen.getByRole('button', { name: new RegExp(`remove ${otherMember.name}`, 'i') })
    ).toBeInTheDocument()
  })

  it('member does not see any Remove button', async () => {
    server.use(
      http.get(`http://localhost:4000/orgs/${SLUG}/members`, () =>
        HttpResponse.json([plainMember, otherMember])
      )
    )
    renderMembersPage()
    await screen.findByText(otherMember.name)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('no Remove button is shown for the current user regardless of their role', async () => {
    renderMembersPage() // only ownerMember in list (= current user)
    await screen.findByText(ownerMember.name)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })
})
