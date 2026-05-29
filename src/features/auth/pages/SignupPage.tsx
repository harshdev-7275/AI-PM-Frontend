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

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '201–500', '500+']
const ROLES = ['Engineer', 'Designer', 'Product Manager', 'Marketer', 'Founder', 'Other']

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
  step: number
  total: number
  title: string
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

type Step1Data = { name: string; email: string; password: string }

function Step1({ onNext }: { onNext: (data: Step1Data) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ name, email, password })
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <StepHeader step={1} total={3} title="Create your workspace" />

      <div className="w-full flex flex-col gap-2">
        <OAuthButton icon="google" label="Continue with Google" />
        <OAuthButton icon="microsoft" label="Continue with Microsoft" />
      </div>

      <Divider label="or" />

      <form onSubmit={submit} className="w-full flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-white/60 text-xs">Full name</Label>
          <Input
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
          />
        </div>

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

function Step2({ onNext, onBack }: { onNext: (role: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <StepHeader step={2} total={3} title="What's your role?" />

      <div className="w-full grid grid-cols-2 gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelected(role)}
            className={`px-4 py-3 rounded-lg text-sm border transition-colors text-left ${
              selected === role
                ? 'bg-violet-600/20 border-violet-500/60 text-white'
                : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="w-full flex flex-col gap-2">
        <Button
          onClick={() => selected && onNext(selected)}
          disabled={!selected}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 gap-2"
        >
          Continue <Icon name="arrow-right" size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-white/35 hover:text-white/60 hover:bg-transparent"
        >
          Back to previous step
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Your Organization ────────────────────────────────────────────────

function Step3({ onSubmit, onBack }: { onSubmit: () => void; onBack: () => void }) {
  const [company, setCompany] = useState('')
  const [slug, setSlug] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCompany = (val: string) => {
    setCompany(val)
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    onSubmit()
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <StepHeader
        step={3}
        total={3}
        title="Your organization"
        subtitle="Set up your workspace to collaborate with your team."
      />

      <form onSubmit={submit} className="w-full flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-white/60 text-xs">Company name</Label>
          <Input
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => handleCompany(e.target.value)}
            required
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
              required
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

        <Button
          type="submit"
          disabled={loading || !company || !slug || !teamSize}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 gap-2"
        >
          {loading ? (
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

type WizardData = { name: string; email: string; password: string; role: string }

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [, setData] = useState<Partial<WizardData>>({})

  return (
    <AuthLayout>
      {step === 0 && (
        <Step1 onNext={(d) => { setData((p) => ({ ...p, ...d })); setStep(1) }} />
      )}
      {step === 1 && (
        <Step2
          onNext={(role) => { setData((p) => ({ ...p, role })); setStep(2) }}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <Step3 onSubmit={() => navigate('/')} onBack={() => setStep(1)} />
      )}
    </AuthLayout>
  )
}
