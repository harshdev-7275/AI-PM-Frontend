import { describe, it, expect, vi } from 'vitest'
import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouteErrorBoundary } from './RouteErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }): ReactElement {
  if (shouldThrow) throw new Error('boom')
  return <div>safe content</div>
}

describe('RouteErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <RouteErrorBoundary>
        <Bomb shouldThrow={false} />
      </RouteErrorBoundary>
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('renders a fallback with the error message when a child throws', () => {
    // Suppress the React error boundary console.error noise.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <RouteErrorBoundary label="the test route">
        <Bomb shouldThrow={true} />
      </RouteErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/loading the test route/i)).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()

    spy.mockRestore()
  })

  it('offers a Try again button that recovers when the error is gone', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    // First render with error
    const { rerender } = render(
      <RouteErrorBoundary>
        <Bomb shouldThrow={true} />
      </RouteErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Re-render with no error and click Try again to verify the boundary
    // can recover (the parent will re-render children, which are now safe).
    rerender(
      <RouteErrorBoundary>
        <Bomb shouldThrow={false} />
      </RouteErrorBoundary>
    )
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('safe content')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    spy.mockRestore()
  })
})
