import { type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from '@/store/useTheme'

interface ProvidersProps {
  children: ReactNode
}

function ToasterWithTheme() {
  const isDark = useTheme((state) => state.isDark())

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

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToasterWithTheme />
        {children}
      </BrowserRouter>
    </ThemeProvider>
  )
}
