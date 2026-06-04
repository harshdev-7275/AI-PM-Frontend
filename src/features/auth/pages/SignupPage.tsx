import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Icon } from '@/components/primitives/Icon'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { useOrg } from '@/hooks/useOrg'

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
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

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              i < current
                ? 'bg-brand-accent'
                : i === current
                  ? 'bg-brand-primary'
                  : 'dark:bg-white/15 bg-gray-400'
            }`}
          />
          {i < total - 1 && (
            <div className={`w-6 h-px transition-colors ${i < current ? 'bg-brand-accent/60' : 'dark:bg-white/10 bg-gray-300'}`} />
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
      <div className="text-center">
        <h1 className="dark:text-white text-gray-900 text-xl font-semibold tracking-tight whitespace-nowrap">{title}</h1>
        {subtitle && <p className="dark:text-white/40 text-gray-700 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <StepDots current={step - 1} total={total} />
      <p className="dark:text-white/30 text-gray-600 text-[10px] uppercase tracking-widest">
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
  onChange: (field: 'name' | 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => void
  onNext:   (e: React.FormEvent) => void
}

function Step1({ name, email, password, onChange, onNext }: Omit<Step1Props, 'error'>) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <StepHeader step={1} total={3} title="Create your workspace" />
        </motion.div>

        <motion.div variants={itemVariants} className="w-full flex flex-col gap-2">
          <OAuthButton icon="google"     label="Continue with Google" />
          <OAuthButton icon="microsoft"  label="Continue with Microsoft" />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Divider label="or" />
        </motion.div>

        <motion.form variants={itemVariants} onSubmit={onNext} className="w-full flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label className="dark:text-white/60 text-gray-700 text-xs">Full name</Label>
          <Input
            placeholder="Jane Doe"
            value={name}
            onChange={onChange('name')}
            required
            autoComplete="name"
            className="dark:bg-white/[0.05] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/20 placeholder:text-gray-500 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="dark:text-white/60 text-gray-700 text-xs">Work email</Label>
          <Input
            type="email"
            placeholder="jane@company.com"
            value={email}
            onChange={onChange('email')}
            required
            autoComplete="email"
            className="dark:bg-white/[0.05] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/20 placeholder:text-gray-500 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="dark:text-white/60 text-gray-700 text-xs">Password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={onChange('password')}
            required
            autoComplete="new-password"
            className="dark:bg-white/[0.05] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/20 placeholder:text-gray-500 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/50"
          />
        </div>

        <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white border-0 gap-2">
          Continue <Icon name="arrow-right" size={16} />
        </Button>
        </motion.form>

        <motion.p variants={itemVariants} className="dark:text-white/35 text-gray-600 text-sm text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-accent hover:text-brand-accent-hover transition-colors">
          Log in
        </Link>
      </motion.p>
      </motion.div>
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <StepHeader step={2} total={3} title="What's your role?" />
        </motion.div>

        <motion.div variants={itemVariants} className="w-full">
          <ToggleGroup
            type="single"
            value=""
            onValueChange={(v) => { if (v) onRoleSelect(v) }}
            spacing={2}
            aria-label="Role"
            className="w-full grid grid-cols-2 gap-2"
          >
            {ROLES.map((role) => (
              <ToggleGroupItem
                key={role}
                value={role}
                aria-label={role}
                className="h-auto px-4 py-3 rounded-lg text-sm justify-start text-left dark:bg-white/[0.04] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white/60 text-gray-700 dark:hover:bg-white/[0.08] hover:bg-gray-200 dark:hover:text-white/80 hover:text-gray-900 dark:data-[state=on]:bg-brand-primary/20 data-[state=on]:bg-brand-primary/10 data-[state=on]:text-brand-primary"
              >
                {role}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="dark:text-white/35 text-gray-600 dark:hover:text-white/60 hover:text-gray-900 hover:bg-transparent"
          >
            Back to previous step
          </Button>
        </motion.div>

        <motion.p variants={itemVariants} className="dark:text-white/35 text-gray-600 text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-accent hover:text-brand-accent-hover transition-colors">
            Log in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}

// ─── Step 3: Your Organization ────────────────────────────────────────────────

interface Step3Props {
  isSubmitting:    boolean
  orgName:         string
  orgSlug:         string
  onOrgNameChange: (val: string) => void
  onOrgSlugChange: (val: string) => void
  onSubmit:        (e: React.FormEvent) => void
  onBack:          () => void
}

function Step3({ isSubmitting, orgName, orgSlug, onOrgNameChange, onOrgSlugChange, onSubmit, onBack }: Step3Props) {
  const [teamSize, setTeamSize] = useState('')

  const handleCompany = (val: string) => {
    onOrgNameChange(val)
    onOrgSlugChange(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <StepHeader
            step={3}
            total={3}
            title="Your organization"
            subtitle="Set up your workspace to collaborate with your team."
          />
        </motion.div>

        <motion.form variants={itemVariants} onSubmit={onSubmit} className="w-full flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label className="dark:text-white/60 text-gray-700 text-xs">Company name</Label>
          <Input
            placeholder="Acme Corp"
            value={orgName}
            onChange={(e) => handleCompany(e.target.value)}
            className="dark:bg-white/[0.05] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white text-gray-900 dark:placeholder:text-white/20 placeholder:text-gray-500 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary/50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="dark:text-white/60 text-gray-700 text-xs">Workspace URL</Label>
          <div className="flex rounded-lg overflow-hidden border dark:border-white/10 border-gray-300 focus-within:border-brand-primary/50 focus-within:ring-1 focus-within:ring-brand-primary/50 transition-colors">
            <input
              type="text"
              value={orgSlug}
              onChange={(e) => onOrgSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="acme"
              className="flex-1 dark:bg-white/[0.05] bg-gray-100 px-3 py-2 dark:text-white text-gray-900 text-sm dark:placeholder:text-white/20 placeholder:text-gray-500 outline-none min-w-0"
            />
            <span className="flex items-center px-3 dark:bg-white/[0.03] bg-gray-200 dark:border-l border-l dark:border-white/10 border-gray-300 dark:text-white/35 text-gray-600 text-sm whitespace-nowrap">
              .planiqo.com
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="dark:text-white/60 text-gray-700 text-xs">Team size</Label>
          <Select value={teamSize} onValueChange={setTeamSize}>
            <SelectTrigger className="dark:bg-white/[0.05] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white text-gray-900 focus:ring-brand-primary/50 dark:data-[placeholder]:text-white/25 data-[placeholder]:text-gray-500">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent className="dark:bg-zinc-900 bg-white dark:border-white/10 border-gray-300 dark:text-white text-gray-900">
              {TEAM_SIZES.map((s) => (
                <SelectItem key={s} value={s} className="dark:focus:bg-brand-primary/20 focus:bg-brand-primary/10 dark:focus:text-white focus:text-white">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <p className="dark:text-white/30 text-gray-600 text-[10px] text-center uppercase tracking-widest">Optional</p>
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto py-2.5 gap-3 dark:bg-white/[0.04] bg-gray-100 dark:border-white/10 border-gray-300 dark:text-white/50 text-gray-700 dark:hover:bg-white/[0.08] hover:bg-gray-200 dark:hover:text-white/70 hover:text-gray-900"
          >
            <Icon name="microsoft" size={18} />
            Connect Microsoft Teams
          </Button>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white border-0 gap-2"
        >
          {isSubmitting ? (
            <>
              <Icon name="loader" size={16} className="animate-spin" /> Creating workspace…
            </>
          ) : (
            'Create workspace'
          )}
        </Button>
        </motion.form>

        <motion.div variants={itemVariants}>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="dark:text-white/35 text-gray-600 dark:hover:text-white/60 hover:text-gray-900 hover:bg-transparent"
          >
            Back to previous step
          </Button>
        </motion.div>

        <motion.p variants={itemVariants} className="dark:text-white/35 text-gray-600 text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-accent hover:text-brand-accent-hover transition-colors">
            Log in
          </Link>
        </motion.p>
      </motion.div>
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
  const navigate           = useNavigate()
  const [searchParams]     = useSearchParams()
  const inviteToken        = searchParams.get('invite')
  const { register }       = useAuth()
  const { createOrg }      = useOrg()

  const [form, setForm]               = useState<FormData>({ name: '', email: '', password: '', jobTitle: '' })
  const [orgName, setOrgName]         = useState('')
  const [orgSlug, setOrgSlug]         = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field: 'name' | 'email' | 'password') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
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
    setIsSubmitting(true)
    try {
      // Step 1 — create user account, stores token in auth store
      await register(form.name, form.email, form.password, form.jobTitle)

      // Step 2 — create org using the token now in the auth store
      const org = await createOrg(orgName, orgSlug)

      // Step 3 — if an invite is pending, complete the flow; otherwise go to the new org
      toast.success('Workspace created successfully!')
      navigate(inviteToken ? `/invite/${inviteToken}` : `/${org.slug}/dashboard`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <>
        {currentStep === 1 && (
          <Step1
            name={form.name}
            email={form.email}
            password={form.password}
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
          <div>
            <Step3
              isSubmitting={isSubmitting}
              orgName={orgName}
              orgSlug={orgSlug}
              onOrgNameChange={setOrgName}
              onOrgSlugChange={setOrgSlug}
              onSubmit={handleFinalSubmit}
              onBack={() => setCurrentStep(2)}
            />
          </div>
        )}
      </>
    </AuthLayout>
  )
}
