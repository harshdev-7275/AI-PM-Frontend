import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface RouteErrorBoundaryProps {
  children: ReactNode
  /** Optional label shown in the fallback (e.g. "the login page"). */
  label?: string
}

interface RouteErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Per-route error boundary. Use this inside <Route element={...}> so a
 * render error in one route doesn't blank out the entire app.
 * The global GlobalErrorBoundary in providers.tsx is the last line of
 * defense; this is the first.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // Centralised logging would go here (Sentry, etc.)
    // eslint-disable-next-line no-console
    console.error(`[RouteErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center"
        >
          <h1 className="text-2xl font-semibold text-foreground">
            {this.props.label
              ? `Something went wrong loading ${this.props.label}.`
              : 'Something went wrong.'}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleReset}>
              Try again
            </Button>
            <Button onClick={this.handleReload}>Reload page</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
