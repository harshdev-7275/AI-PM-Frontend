import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'

interface PublicRouteProps {
  children: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const isLoading       = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentOrg      = useOrgStore((s) => s.currentOrg)

  if (isLoading) return null

  if (isAuthenticated) {
    // If we already have an org in the store, go straight to its dashboard.
    // Otherwise fall back to /login so OrgRoute can load the org fresh.
    const destination = currentOrg ? `/${currentOrg.slug}/dashboard` : '/login'
    return <Navigate to={destination} replace />
  }

  return <>{children}</>
}
