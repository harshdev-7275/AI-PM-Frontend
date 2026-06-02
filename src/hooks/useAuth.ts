import { useAuthStore } from '@/store/useAuthStore'
import { loginUser, registerUser, logoutUser, refreshToken, getMe } from '@/services/api'

// Module-level guard so a single failed refresh per page load doesn't fire
// three times (AppInitializer + axios interceptor on 401 + manual call).
let hasTriedRefresh = false

// Hard cap on how long initialize() will wait for the backend. Even if the
// network hangs, isLoading flips to false so the UI can render.
const INITIALIZE_TIMEOUT_MS = 5_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err)   => { clearTimeout(timer); reject(err) },
    )
  })
}

export function useAuth() {
  const { user, isLoading, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  const login = async (email: string, password: string): Promise<void> => {
    const { user, accessToken } = await loginUser(email, password)
    setAuth(user, accessToken)
  }

  const register = async (
    name:      string,
    email:     string,
    password:  string,
    jobTitle?: string,
  ): Promise<void> => {
    const { user, accessToken } = await registerUser(name, email, password, jobTitle)
    setAuth(user, accessToken)
  }

  const logout = async (): Promise<void> => {
    await logoutUser()
    clearAuth()
  }

  const initialize = async (): Promise<void> => {
    // Skip the refresh round-trip if we already attempted it this page load.
    if (hasTriedRefresh) {
      // Still ensure isLoading is false on subsequent calls.
      if (useAuthStore.getState().isLoading) clearAuth()
      return
    }
    hasTriedRefresh = true

    try {
      const { accessToken } = await withTimeout(
        refreshToken(),
        INITIALIZE_TIMEOUT_MS,
        'Session refresh',
      )
      const user = await withTimeout(
        getMe(accessToken),
        INITIALIZE_TIMEOUT_MS,
        'Session fetch user',
      )
      setAuth(user, accessToken)
    } catch {
      // Expected on first visit, after session expiry, or when the backend
      // is unreachable — treat as logged out so the UI can render.
      clearAuth()
    } finally {
      // Defensive: if some path leaves isLoading=true (e.g. a code change
      // that forgets to call clearAuth), flip it now.
      if (useAuthStore.getState().isLoading) clearAuth()
    }
  }

  return { login, register, logout, initialize, user, isLoading, isAuthenticated }
}

// Test helper — resets the module-level refresh guard between tests.
export function __resetAuthForTests(): void {
  hasTriedRefresh = false
}
