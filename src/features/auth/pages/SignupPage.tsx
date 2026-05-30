import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icon } from '@/components/primitives/Icon'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/hooks/useAuth'

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '201–500', '500+']
const ROLES      = ['Engineer', 'Designer', 'Product Manager', 'Marketer', 'Founder', 'Other']

const ROLE_TO_JOB_TITLE: Record<string, string> = {
  'Engineer':        'engineer',
  'Designer':        'designer',
  'Product Manager': 'product_manager',
  'Marketer':        'marketer',
  'Founder':         'founder',
  'Other':           'other',
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

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              i < current
                ? 'bg-violet-500'
                : i === current
                  ? 'bg-violet-600'
                  : 'bg-white/15'
            }`}
          />
          {i < total - 1 && (
            <div className={`w-6 h-px transition-colors ${i < current ? 'bg-violet-500/60' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function StepHeader({
  step,
  total,
  title,
  subtitle,
}: {
  step:      number
  total:     number
  title:     string
  subtitle?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
        <Icon name="hexagon" size={18} className="text-violet-400" />
      </div>
      <div className="text-center">
        <p className="text-violet-400 text-xs font-medium">Vortex AI</p>
        <h1 className="text-white text-xl font-semibold tracking-tight whitespace-nowrap">{title}</h1>
        {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <StepDots current={step - 1} total={total} />
      <p className="text-white/30 text-[10px] uppercase tracking-widest">
        Step {step} of {total}
      </p>
    </div>
  )
}

// ─── Step 1: Your Details ─────────────────────────────────────────────────────

interface Step1Props {
  name:     string
  email:    string
  password: string
  error:    string
  onChange: (field: 'name' | 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => void
  onNext:   (e: React.FormEvent) => void
}

function Step1({ name, email, password, error, onChange, onNext }: Step1Props) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <StepHeader step={1} total={3} title="Create your workspace" />

      <div className="w-full flex flex-col gap-2">
        <OAuthButton icon="google"     label="Continue with Google" />
        <OAuthButton icon="microsoft"  label="Continue with Microsoft" />
      </div>

      <Divider label="or" />

      <form onSubmit={onNext} className="w-full flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-white/60 text-xs">Full name</Label>
          <Input
            placeholder="Jane Doe"
            value={name}
            onChange={onChange('name')}
            required
            autoComplete="name"
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-white/60 text-xs">Work email</Label>
          <Input
            type="email"
            placeholder="jane@company.com"
            value={email}
            onChange={onChange('email')}
            required
            autoComplete="email"
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-white/60 text-xs">Password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={onChange('password')}
            required
            autoComplete="new-password"
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
          />
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm text-center">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 gap-2">
          Continue <Icon name="arrow-right" size={16} />
        </Button>
      </form>

      <p className="text-white/35 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
          Log in
        </Link>
      </p>
    </div>
  )
}

// ─── Step 2: Your Role ────────────────────────────────────────────────────────

interface Step2Props {
  onRoleSelect: (role: string) => void
  onBack:       () => void
}

function Step2({ onRoleSelect, onBack }: Step2Props) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <StepHeader step={2} total={3} title="What's your role?" />

      <div className="w-full grid grid-cols-2 gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onRoleSelect(role)}
            className="px-4 py-3 rounded-lg text-sm border transition-colors text-left bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80"
          >
            {role}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="text-white/35 hover:text-white/60 hover:bg-transparent"
      >
        Back to previous step
      </Button>
    </div>
  )
}

// ─── Step 3: Your Organization ────────────────────────────────────────────────

interface Step3Props {
  error:        string
  isSubmitting: boolean
  onSubmit:     (e: React.FormEvent) => void
  onBack:       () => void
}

function Step3({ error, isSubmitting, onSubmit, onBack }: Step3Props) {
  const [company,  setCompany]  = useState('')
  const [slug,     setSlug]     = useState('')
  const [teamSize, setTeamSize] = useState('')

  const handleCompany = (val: string) => {
    setCompany(val)
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <StepHeader
        step={3}
        total={3}
        title="Your organization"
        subtitle="Set up your workspace to collaborate with your team."
      />

      <form onSubmit={onSubmit} className="w-full flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-white/60 text-xs">Company name</Label>
          <Input
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => handleCompany(e.target.value)}
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-white/60 text-xs">Workspace URL</Label>
          <div className="flex rounded-lg overflow-hidden border border-white/10 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50 transition-colors">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="acme"
              className="flex-1 bg-white/[0.05] px-3 py-2 text-white text-sm placeholder:text-white/20 outline-none min-w-0"
            />
            <span className="flex items-center px-3 bg-white/[0.03] border-l border-white/10 text-white/35 text-sm whitespace-nowrap">
              .vortex.ai
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-white/60 text-xs">Team size</Label>
          <Select value={teamSize} onValueChange={setTeamSize}>
            <SelectTrigger className="bg-white/[0.05] border-white/10 text-white focus:ring-violet-500/50 data-[placeholder]:text-white/25">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              {TEAM_SIZES.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-violet-600/20 focus:text-white">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-white/30 text-[10px] text-center uppercase tracking-widest">Optional</p>
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto py-2.5 gap-3 bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white/70"
          >
            <Icon name="microsoft" size={18} />
            Connect Microsoft Teams
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm text-center">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 gap-2"
        >
          {isSubmitting ? (
            <>
              <Icon name="loader" size={16} className="animate-spin" /> Creating workspace…
            </>
          ) : (
            'Create workspace'
          )}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="text-white/35 hover:text-white/60 hover:bg-transparent"
      >
        Back to previous step
      </Button>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface FormData {
  name:     string
  email:    string
  password: string
  jobTitle: string
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm]             = useState<FormData>({ name: '', email: '', password: '', jobTitle: '' })
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError]           = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field: 'name' | 'email' | 'password') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setCurrentStep(2)
  }

  const handleRoleSelect = (role: string) => {
    setForm((prev) => ({ ...prev, jobTitle: ROLE_TO_JOB_TITLE[role] ?? role.toLowerCase() }))
    setCurrentStep(3)
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await register(form.name, form.email, form.password, form.jobTitle)
      navigate('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {currentStep === 1 && (
        <Step1
          name={form.name}
          email={form.email}
          password={form.password}
          error={error}
          onChange={updateField}
          onNext={handleStep1Continue}
        />
      )}
      {currentStep === 2 && (
        <Step2
          onRoleSelect={handleRoleSelect}
          onBack={() => setCurrentStep(1)}
        />
      )}
      {currentStep === 3 && (
        <Step3
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={handleFinalSubmit}
          onBack={() => setCurrentStep(2)}
        />
      )}
    </AuthLayout>
  )
}
