import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SettingsPage from './SettingsPage'

function renderSettingsPage() {
  return render(
    <MemoryRouter initialEntries={['/test-org/settings']}>
      <Routes>
        <Route path="/:slug/settings" element={<SettingsPage />}>
          <Route index element={<div>general tab content</div>} />
          <Route path="members" element={<div>members tab content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('SettingsPage', () => {
  it('renders the settings heading', () => {
    renderSettingsPage()
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders the Members nav link', () => {
    renderSettingsPage()
    expect(screen.getByRole('link', { name: /members/i })).toBeInTheDocument()
  })

  it('renders the General nav link', () => {
    renderSettingsPage()
    expect(screen.getByRole('link', { name: /general/i })).toBeInTheDocument()
  })

  it('renders child route content via Outlet', () => {
    renderSettingsPage()
    expect(screen.getByText('general tab content')).toBeInTheDocument()
  })
})
