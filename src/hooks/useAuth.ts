import { useAuthStore } from '@/store/useAuthStore'
import { loginUser, registerUser, logoutUser, refreshToken, getMe } from '@/services/api'

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
    try {
      const { accessToken } = await refreshToken()
      const user = await getMe(accessToken)
      setAuth(user, accessToken)
    } catch {
      // Expected on first visit or after session expiry — treat as logged out
      clearAuth()
    }
  }

  return { login, register, logout, initialize, user, isLoading, isAuthenticated }
}
