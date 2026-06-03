import { useAuthStore } from '@/store/useAuthStore'
import { loginUser, registerUser, logoutUser, refreshToken, getMe } from '@/services/api'

// Module-level cache of the session-restore promise. A single page load should
// trigger exactly one refresh, but React StrictMode invokes the mount effect
// twice. Every caller awaits this same promise instead of starting a second
// refresh — critically, a repeat call must never clear an in-flight restore,
// which would bounce the user to /login mid-refresh.
let initializePromise: Promise<void> | null = null

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

  const initialize = (): Promise<void> => {
    // De-duplicate concurrent/repeat calls — share the one in-flight restore.
    // A later caller awaits the same promise; it never clears a session that
    // the first caller is still restoring.
    if (initializePromise) return initializePromise

    initializePromise = (async () => {
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
    })()

    return initializePromise
  }

  return { login, register, logout, initialize, user, isLoading, isAuthenticated }
}

// Test helper — clears the cached restore promise between tests.
export function __resetAuthForTests(): void {
  initializePromise = null
}
