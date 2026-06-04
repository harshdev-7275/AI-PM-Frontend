import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ChatConfirmActions } from './ChatConfirmActions'

describe('ChatConfirmActions', () => {
  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ChatConfirmActions onConfirm={onConfirm} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: /yes/i }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when the cancel button is clicked', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ChatConfirmActions onConfirm={onConfirm} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: /^no$/i }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('disables both buttons while a reply is in flight', () => {
    render(<ChatConfirmActions onConfirm={vi.fn()} onCancel={vi.fn()} disabled />)

    expect(screen.getByRole('button', { name: /yes/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^no$/i })).toBeDisabled()
  })
})
