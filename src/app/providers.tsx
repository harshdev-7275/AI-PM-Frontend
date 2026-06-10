import { Component, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from '@/store/useTheme'
import { Button } from '@/components/ui/button'
import { queryClient } from '@/lib/queryClient'

interface ProvidersProps {
  children: ReactNode
}

function ToasterWithTheme() {
  const theme = useTheme((state) => state.theme)
  const isDark = useTheme((state) => state.isDark())

  // When theme === 'system', the OS preference change is handled by
  // ThemeProvider (which toggles <html>'s .dark class) but does not
  // re-trigger zustand subscribers. Mirror the matchMedia here so the
  // Toaster re-renders immediately on OS preference flips.
  const [, setOsTick] = useState(0)
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => setOsTick((n) => n + 1)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return (
    <Toaster
      position="bottom-right"
      richColors
      theme={isDark ? 'dark' : 'light'}
      toastOptions={{
        style: {
          background: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          color: 'oklch(55% 0.28 245)',
        },
      }}
    />
  )
}

interface GlobalErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      )
    }
    return this.props.children
  }
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <GlobalErrorBoundary>
            <ToasterWithTheme />
            {children}
          </GlobalErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
