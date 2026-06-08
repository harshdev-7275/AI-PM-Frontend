import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusPill } from './StatusPill'

describe('StatusPill', () => {
  it('renders nothing for "executed" (success) status', () => {
    const { container } = render(<StatusPill status="executed" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no status and no intent are given', () => {
    const { container } = render(<StatusPill />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an awaiting_confirmation pill with a confirm-style tone', () => {
    render(<StatusPill status="awaiting_confirmation" />)
    expect(screen.getByText(/awaiting confirmation/i)).toBeInTheDocument()
  })

  it('renders an error pill with a destructive tone', () => {
    render(<StatusPill status="error" />)
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })

  it('renders the intent chip when intent is provided', () => {
    render(<StatusPill status="executed" intent="create_issue" />)
    expect(screen.getByText('create_issue')).toBeInTheDocument()
  })

  it('omits the intent chip when intent is absent', () => {
    const { container } = render(<StatusPill status="executed" />)
    expect(container.querySelector('[data-testid="status-intent"]')).toBeNull()
  })

  it('groups both pills into a single status row', () => {
    const { container } = render(
      <StatusPill status="awaiting_confirmation" intent="create_issue" />,
    )
    expect(container.querySelector('[data-testid="status-row"]')).not.toBeNull()
    expect(screen.getByText(/awaiting confirmation/i)).toBeInTheDocument()
    expect(screen.getByText('create_issue')).toBeInTheDocument()
  })
})
