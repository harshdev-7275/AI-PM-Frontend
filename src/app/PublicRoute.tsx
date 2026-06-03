import { type ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'
import { useOrg } from '@/hooks/useOrg'

interface PublicRouteProps {
  children: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const isLoading        = useAuthStore((s) => s.isLoading)
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated)
  const currentOrg       = useOrgStore((s) => s.currentOrg)
  const { loadUserOrgs } = useOrg()
  const [orgLoadAttempted, setOrgLoadAttempted] = useState(false)

  // An authenticated user can land here (e.g. /login) right after a page reload,
  // when the in-memory org store is still empty. Load their orgs so we can route
  // them to their dashboard instead of redirecting /login → /login (a blank loop).
  useEffect(() => {
    if (!isAuthenticated || currentOrg) return

    let cancelled = false
    void loadUserOrgs().finally(() => {
      if (!cancelled) setOrgLoadAttempted(true)
    })
    return () => { cancelled = true }
  }, [isAuthenticated, currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return null

  if (isAuthenticated) {
    if (currentOrg) {
      return <Navigate to={`/${currentOrg.slug}/dashboard`} replace />
    }
    // Resolving the user's org — show a loader rather than the login form.
    if (!orgLoadAttempted) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }
    // Authenticated but the account has no org to route to — fall through and
    // render the page rather than spinning forever.
  }

  return <>{children}</>
}
