import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user:            User | null
  accessToken:     string | null
  isLoading:       boolean
  isAuthenticated: boolean
}

interface AuthActions {
  setAuth:   (user: User, accessToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user:            null,
  accessToken:     null,
  isLoading:       true, // true until initialize() resolves — prevents flash of unauthenticated UI
  isAuthenticated: false,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isLoading: false }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
}))
