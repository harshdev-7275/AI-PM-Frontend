import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Hexagon,
  Loader2,
  Lock,
  Mail,
  User,
  X,
  Zap,
} from 'lucide-react'

const lucide = {
  'arrow-right': ArrowRight,
  building: Building2,
  check: Check,
  'chevron-down': ChevronDown,
  eye: Eye,
  'eye-off': EyeOff,
  hexagon: Hexagon,
  loader: Loader2,
  lock: Lock,
  mail: Mail,
  user: User,
  x: X,
  zap: Zap,
} satisfies Record<string, LucideIcon>

function GoogleSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-label="Google">
      <path fill="#4285F4" d="M16.51 8.18H8.98v3.09h4.3c-.18 1.01-.75 1.87-1.6 2.44v2.03h2.6c1.52-1.4 2.4-3.46 2.4-5.9 0-.57-.05-.92-.17-1.66z" />
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.03a4.8 4.8 0 01-7.18-2.53H1.83v2.07A8 8 0 008.98 17z" />
      <path fill="#FBBC05" d="M4.5 10.5a4.8 4.8 0 010-3.04V5.4H1.83a8 8 0 000 7.17L4.5 10.5z" />
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.46a4.77 4.77 0 014.48-3.28z" />
    </svg>
  )
}

function MicrosoftSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-label="Microsoft">
      <rect x="1" y="1" width="7.5" height="7.5" fill="#F25022" />
      <rect x="9.5" y="1" width="7.5" height="7.5" fill="#7FBA00" />
      <rect x="1" y="9.5" width="7.5" height="7.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900" />
    </svg>
  )
}

const brand = {
  google: GoogleSvg,
  microsoft: MicrosoftSvg,
} satisfies Record<string, React.FC<{ size: number }>>

type LucideIconName = keyof typeof lucide
type BrandIconName = keyof typeof brand
export type IconName = LucideIconName | BrandIconName

export interface IconProps {
  name: IconName
  size?: number
  className?: string
}

// Usage: <Icon name="mail" size={16} className="text-white/30" />
export function Icon({ name, size = 16, className }: IconProps) {
  if (name in brand) {
    const BrandIcon = brand[name as BrandIconName]
    return <BrandIcon size={size} />
  }
  const LucideIcon = lucide[name as LucideIconName]
  return <LucideIcon size={size} className={className} />
}
