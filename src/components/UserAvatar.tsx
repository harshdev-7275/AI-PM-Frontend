import { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, generatedAvatarUri } from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name:       string
  /** Uploaded photo URL; when absent a deterministic DiceBear avatar is shown. */
  avatarUrl?: string | null
  /** Stable seed for the generated avatar (use the user id). Falls back to name. */
  seed?:      string
  className?: string
}

/**
 * Renders a user's avatar with a consistent fallback chain everywhere:
 *   uploaded photo → generated DiceBear avatar (deterministic) → initials.
 */
export function UserAvatar({ name, avatarUrl, seed, className }: UserAvatarProps) {
  const generated = useMemo(() => generatedAvatarUri(seed || name), [seed, name])
  return (
    <Avatar className={cn('size-8', className)}>
      <AvatarImage src={avatarUrl || generated} alt={name} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
