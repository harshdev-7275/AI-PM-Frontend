import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from 'zustand/middleware'
import { z } from 'zod'

/**
 * Allowed theme values. 'system' is wired up but dark theme is not yet
 * visually enabled — see `ThemeProvider`. Light is the active default.
 */
const ThemeSchema = z.enum(['light', 'dark', 'system'])
export type Theme = z.infer<typeof ThemeSchema>

/**
 * Shape of the blob zustand/persist writes to localStorage.
 * Validated on read so a corrupted / tampered value cannot crash the app.
 */
const PersistedStateSchema = z.object({
  state: z.object({ theme: ThemeSchema }),
  version: z.number(),
})

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: () => boolean
}

/**
 * localStorage adapter that validates the persisted blob with Zod at the
 * boundary. Returns null (treat as "not present") for any failure.
 */
const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(name)
    if (raw === null) return null
    try {
      const result = PersistedStateSchema.safeParse(JSON.parse(raw))
      return result.success ? raw : null
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(name, value)
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
  },
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme: Theme): void => {
        set({ theme })
      },
      isDark: (): boolean => {
        const theme = get().theme
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return theme === 'dark'
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => safeStorage),
      // Persist only the data, not the function reference.
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
