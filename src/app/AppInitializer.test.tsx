import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import { useAuthStore } from '@/store/useAuthStore'
import { AppInitializer } from './AppInitializer'

beforeEach(() => {
  useAuthStore.setState({
    user:            null,
    accessToken:     null,
    isLoading:       true,
    isAuthenticated: false,
  })
})

describe('AppInitializer', () => {
  it('renders nothing while session is being restored', () => {
    // isLoading starts true — component must not render children yet
    render(<AppInitializer><div>app content</div></AppInitializer>)

    expect(screen.queryByText('app content')).not.toBeInTheDocument()
  })

  it('renders children after session is successfully restored', async () => {
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'mock-access-token', expiresIn: 900 })
      )
    )

    render(<AppInitializer><div>app content</div></AppInitializer>)

    await waitFor(() => {
      expect(screen.getByText('app content')).toBeInTheDocument()
    })
  })

  it('renders children when no valid session exists (logged out state)', async () => {
    server.use(
      http.post('http://localhost:4000/auth/refresh', () =>
        HttpResponse.json(
          { error: 'NO_REFRESH_TOKEN', message: 'No refresh token found' },
          { status: 401 },
        )
      )
    )

    render(<AppInitializer><div>app content</div></AppInitializer>)

    await waitFor(() => {
      expect(screen.getByText('app content')).toBeInTheDocument()
    })
  })
})
