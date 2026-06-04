import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { acceptInvitation } from '@/services/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// =============================================================================
// STATE
// =============================================================================

type PageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; orgSlug: string }
  | { status: 'error'; message: string }

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const code = err.response?.data?.error as string | undefined
    if (code === 'TOKEN_EXPIRED') {
      return 'This invite link has expired. Ask your team admin to send a new one.'
    }
    if (code === 'TOKEN_USED' || code === 'ALREADY_ACCEPTED') {
      return 'This invite link has already been used.'
    }
    const msg = err.response?.data?.message as string | undefined
    return msg ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function AcceptInvitePage() {
  const { token }        = useParams<{ token: string }>()
  const navigate         = useNavigate()
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated)

  // Authenticated users skip the invite card and go straight to the loading state
  const [pageState, setPageState] = useState<PageState>(
    () => isAuthenticated ? { status: 'loading' } : { status: 'idle' }
  )

  // Prevents the accept call from firing twice in React StrictMode
  const hasAttempted = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !token || hasAttempted.current) return
    hasAttempted.current = true

    async function handleAccept() {
      try {
        const { slug } = await acceptInvitation(token!)
        setPageState({ status: 'success', orgSlug: slug })
        setTimeout(() => navigate(`/${slug}/dashboard`), 1500)
      } catch (err) {
        setPageState({ status: 'error', message: errorMessage(err) })
      }
    }

    void handleAccept()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ────────────────────────────────────────────────────────────────

  if (pageState.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <p className="text-sm text-muted-foreground">Joining workspace…</p>
        </div>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────

  if (pageState.status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Welcome to the team! Redirecting…
          </h1>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (pageState.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Alert variant="destructive" className="w-full max-w-sm border-destructive/40 shadow-sm">
          <AlertTitle>Invite link problem</AlertTitle>
          <AlertDescription>{pageState.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // ── Unauthenticated / idle ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-lg font-semibold text-foreground mb-2">
          You&apos;ve been invited
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in or create an account to join the workspace.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to={`/login?invite=${token}`}
            className="inline-flex items-center justify-center rounded-md bg-brand-primary text-white text-sm font-medium h-9 px-4 hover:bg-brand-primary/90 transition-colors"
          >
            Sign in to accept
          </Link>
          <Link
            to={`/signup?invite=${token}`}
            className="inline-flex items-center justify-center rounded-md border border-border text-sm font-medium h-9 px-4 hover:bg-accent transition-colors text-foreground"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
