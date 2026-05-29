import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/primitives/Icon'
import AuthLayout from '@/features/auth/components/AuthLayout'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    navigate('/')
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <Icon name="zap" size={20} className="text-white fill-white" />
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Welcome back</h1>
        </div>

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
            <Icon name="mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="pl-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Icon name="lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 mt-1 gap-2"
          >
            {loading ? (
              <>
                <Icon name="loader" size={16} className="animate-spin" /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <p className="text-white/35 text-sm">
          No account?{' '}
          <Link to="/signup" className="text-violet-400 hover:text-violet-300 transition-colors">
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
      className="w-full h-auto py-2.5 gap-3 bg-white/[0.06] border-white/10 text-white/80 hover:bg-white/10 hover:text-white/90"
    >
      <Icon name={icon} size={18} />
      {label}
    </Button>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-white/30 text-xs">{label}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  )
}
