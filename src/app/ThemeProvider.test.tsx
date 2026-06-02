import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { useTheme } from '@/store/useTheme'
import { ThemeProvider } from './ThemeProvider'

function getHtmlDarkClass(): boolean {
  return document.documentElement.classList.contains('dark')
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    useTheme.setState({ theme: 'light' })
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('applies the light theme on mount (no .dark class) when theme is "light"', () => {
    useTheme.setState({ theme: 'light' })
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    )

    expect(getHtmlDarkClass()).toBe(false)
  })

  it('applies the dark theme on mount (adds .dark class) when theme is "dark"', () => {
    useTheme.setState({ theme: 'dark' })
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    )

    expect(getHtmlDarkClass()).toBe(true)
  })

  it('reacts to theme changes — toggles .dark class off when switching to "light"', () => {
    useTheme.setState({ theme: 'dark' })
    const { rerender } = render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    )
    expect(getHtmlDarkClass()).toBe(true)

    act(() => {
      useTheme.setState({ theme: 'light' })
    })
    rerender(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    )

    expect(getHtmlDarkClass()).toBe(false)
  })
})
