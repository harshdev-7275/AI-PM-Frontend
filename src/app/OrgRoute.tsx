import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useOrg } from '@/hooks/useOrg'

interface OrgRouteProps {
  children: ReactNode
}

export function OrgRoute({ children }: OrgRouteProps) {
  const { slug } = useParams<{ slug: string }>()
  const { currentOrg, orgs, isLoading, loadUserOrgs, switchOrg } = useOrg()
  const [attempted, setAttempted] = useState(false)

  // When the slug in the URL changes, ensure the matching org is loaded.
  // Only depends on slug — intentionally runs once per slug change.
  useEffect(() => {
    setAttempted(false)

    if (currentOrg?.slug === slug) {
      setAttempted(true)
      return
    }

    void loadUserOrgs().finally(() => setAttempted(true))
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // After orgs load, sync currentOrg to whichever org matches the URL slug.
  // Handles the case where the user navigates to a different org's URL directly.
  useEffect(() => {
    if (!attempted || currentOrg?.slug === slug) return
    const match = orgs.find((o) => o.slug === slug)
    if (match) switchOrg(match)
  }, [attempted, orgs, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !attempted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!orgs.find((o) => o.slug === slug)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
