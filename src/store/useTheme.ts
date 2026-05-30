import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: () => boolean
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme: Theme) => {
        set({ theme })
        applyTheme(theme)
      },
      isDark: () => {
        const theme = get().theme
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return theme === 'dark'
      },
    }),
    {
      name: 'theme-store',
    }
  )
)

export function applyTheme(theme: Theme) {
  const html = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme-store')
  if (stored) {
    const { state } = JSON.parse(stored)
    applyTheme(state.theme)
  } else {
    applyTheme('system')
  }
}
