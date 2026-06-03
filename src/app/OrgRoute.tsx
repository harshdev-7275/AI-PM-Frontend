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

  // The slug we've finished a load attempt for. Set only inside the async
  // callback so we never call setState synchronously within an effect body.
  const [loadedForSlug, setLoadedForSlug] = useState<string | null>(null)

  // Derived from render state — no effect needed.
  const orgReady  = currentOrg?.slug === slug
  const attempted = orgReady || loadedForSlug === slug

  // Load the user's orgs whenever we don't already have the one named in the URL.
  useEffect(() => {
    if (orgReady) return

    let cancelled = false
    void loadUserOrgs().finally(() => {
      if (!cancelled) setLoadedForSlug(slug ?? null)
    })
    return () => { cancelled = true }
  }, [slug, orgReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Once orgs are loaded, point currentOrg at whichever one matches the URL slug
  // (loadUserOrgs defaults currentOrg to the first org).
  useEffect(() => {
    if (orgReady) return
    const match = orgs.find((o) => o.slug === slug)
    if (match) switchOrg(match)
  }, [orgs, slug, orgReady]) // eslint-disable-line react-hooks/exhaustive-deps

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
