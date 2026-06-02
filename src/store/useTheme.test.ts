import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useTheme } from './useTheme'

const STORAGE_KEY = 'theme-store'

/**
 * Helper: clear localStorage and reset the store to a known baseline.
 * Zustand's `persist` middleware re-hydrates from localStorage on creation;
 * we use `useTheme.setState` to clear and `localStorage.clear` to wipe the
 * persisted slot. We also reset the internal storage event handler by
 * recreating the store reference through dynamic import per-test only when
 * needed. For these tests we work with the live store.
 */
function resetStoreToLight(): void {
  localStorage.clear()
  useTheme.setState({ theme: 'light' })
}

describe('useTheme store', () => {
  beforeEach(() => {
    resetStoreToLight()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('defaults theme to "light" when no value is stored', () => {
    expect(useTheme.getState().theme).toBe('light')
  })

  it('updates the theme when setTheme is called', () => {
    act(() => {
      useTheme.getState().setTheme('dark')
    })

    expect(useTheme.getState().theme).toBe('dark')
  })

  it('persists the theme to localStorage', () => {
    act(() => {
      useTheme.getState().setTheme('dark')
    })

    const stored = localStorage.getItem(STORAGE_KEY)
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!)).toMatchObject({
      state: { theme: 'dark' },
      version: 0,
    })
  })

  it('rehydrates from localStorage on creation when a valid value is stored', async () => {
    // Seed a valid persisted blob, then re-import the store fresh.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { theme: 'dark' }, version: 0 })
    )

    // Force a fresh module evaluation so persist middleware re-reads storage.
    vi.resetModules()
    const { useTheme: freshUseTheme } = await import('./useTheme')

    expect(freshUseTheme.getState().theme).toBe('dark')
  })

  it('falls back to "light" when localStorage holds a corrupt JSON blob', async () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{')

    vi.resetModules()
    const { useTheme: freshUseTheme } = await import('./useTheme')

    expect(freshUseTheme.getState().theme).toBe('light')
  })

  it('falls back to "light" when localStorage holds a structurally invalid value', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { theme: 'rainbow' }, version: 0 })
    )

    vi.resetModules()
    const { useTheme: freshUseTheme } = await import('./useTheme')

    expect(freshUseTheme.getState().theme).toBe('light')
  })

  it('isDark() returns true only when theme is "dark"', () => {
    expect(useTheme.getState().isDark()).toBe(false)

    act(() => {
      useTheme.getState().setTheme('dark')
    })
    expect(useTheme.getState().isDark()).toBe(true)
  })

  it('setTheme does not touch the DOM (side effect lives in ThemeProvider)', () => {
    const addSpy = vi.spyOn(document.documentElement.classList, 'add')
    const removeSpy = vi.spyOn(document.documentElement.classList, 'remove')

    act(() => {
      useTheme.getState().setTheme('dark')
    })

    expect(addSpy).not.toHaveBeenCalled()
    expect(removeSpy).not.toHaveBeenCalled()

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
