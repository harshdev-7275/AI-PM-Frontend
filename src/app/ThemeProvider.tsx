import { useEffect } from 'react'
import { useTheme, type Theme } from '@/store/useTheme'

/**
 * Applies the active theme to <html> by toggling the `dark` class.
 * Single source of truth for the DOM side effect — the store stays pure.
 */
function applyTheme(theme: Theme): void {
  const html = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  html.classList.toggle('dark', isDark)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useTheme((state) => state.theme)

  // Apply on mount and whenever the theme value changes.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Re-apply when the OS preference flips while theme === 'system'.
  useEffect(() => {
    if (theme !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (): void => applyTheme('system')
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return <>{children}</>
}
