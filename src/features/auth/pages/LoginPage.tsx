import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/primitives/Icon'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken    = searchParams.get('invite')
  const { login }      = useAuth()

  // Form state via React Hook Form + Zod (FrontendRules §7). RHF owns the field
  // values and the isSubmitting flag; the server-auth failure is surfaced as a
  // toast, not a field error, since it isn't tied to one input.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate(inviteToken ? `/invite/${inviteToken}` : '/dashboard')
    } catch {
      toast.error('Invalid email or password')
    }
  })

  return (
    <AuthLayout>
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>

        {/* Social auth */}
        <div className="w-full flex flex-col gap-2">
          <OAuthButton icon="google" label="Sign in with Google" />
          <OAuthButton icon="microsoft" label="Sign in with Microsoft" />
        </div>

        {/* Divider */}
        <Divider label="or email" />

        {/* Form */}
        <form onSubmit={onSubmit} noValidate className="w-full flex flex-col gap-3">
          <div className="space-y-1">
            <div className="relative">
              <Icon
                name="mail"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                className="pl-10"
                aria-invalid={errors.email ? true : undefined}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
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
              <Icon
                name="lock"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="pl-10"
                aria-invalid={errors.password ? true : undefined}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1 gap-2"
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

        <p className="text-sm text-muted-foreground">
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
      className="w-full h-auto py-2.5 gap-3"
    >
      <Icon name={icon} size={18} />
      {label}
    </Button>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
