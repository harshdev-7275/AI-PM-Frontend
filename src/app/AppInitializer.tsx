import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/useAuthStore'

interface AppInitializerProps {
  children: ReactNode
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { initialize } = useAuth()
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    void initialize()
    // Intentionally empty deps — runs once on mount to restore session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) return null

  return <>{children}</>
}
