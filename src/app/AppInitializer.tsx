import { useEffect, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
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

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return <>{children}</>
}
