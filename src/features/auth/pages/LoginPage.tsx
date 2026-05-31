import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/primitives/Icon'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const navigate                = useNavigate()
  const [searchParams]          = useSearchParams()
  const inviteToken             = searchParams.get('invite')
  const { login }               = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate(inviteToken ? `/invite/${inviteToken}` : '/dashboard')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        <h1 className="dark:text-white text-gray-900 text-2xl font-semibold tracking-tight">Welcome back</h1>

        {/* Social auth */}
        <div className="w-full flex flex-col gap-2">
          <OAuthButton icon="google" label="Sign in with Google" />
          <OAuthButton icon="microsoft" label="Sign in with Microsoft" />
        </div>

        {/* Divider */}
        <Divider label="or email" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="relative">
            <Icon name="mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="pl-10 dark:bg-white/[0.05] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/25 placeholder:text-gray-500 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/50"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-brand-accent hover:text-brand-accent-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Icon name="lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 pointer-events-none" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-10 dark:bg-white/[0.05] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/25 placeholder:text-gray-500 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/50"
              />
            </div>
           </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white border-0 mt-1 gap-2"
          >
            {isSubmitting ? (
              <>
                <Icon name="loader" size={16} className="animate-spin" /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <p className="dark:text-white/35 text-gray-600 text-sm">
          No account?{' '}
          <Link to="/signup" className="text-brand-accent hover:text-brand-accent-hover transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function OAuthButton({ icon, label }: { icon: 'google' | 'microsoft'; label: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-auto py-2.5 gap-3 dark:bg-white/[0.06] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white/80 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200 dark:hover:text-white/90 hover:text-gray-900"
    >
      <Icon name={icon} size={18} />
      {label}
    </Button>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex-1 h-px dark:bg-white/10 bg-gray-300" />
      <span className="dark:text-white/30 text-gray-600 text-xs">{label}</span>
      <div className="flex-1 h-px dark:bg-white/10 bg-gray-300" />
    </div>
  )
}
