import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'

// =============================================================================
// AVATAR HELPERS
// =============================================================================

/**
 * Initials for a name, e.g. "Harsh Singh" → "HS". Used as the ultimate
 * fallback behind the uploaded photo / generated avatar.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return '??'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

/**
 * Deterministic DiceBear "adventurer" avatar as a data URI. The same seed
 * always yields the same character, so we pass a stable value (user id) and
 * store nothing — it's the fallback when a user hasn't uploaded a photo.
 */
export function generatedAvatarUri(seed: string): string {
  return createAvatar(adventurer, {
    seed,
    radius: 50,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  }).toDataUri()
}

/** A batch of random seeds, for letting the user pick a generated character. */
export function randomAvatarSeeds(count: number): string[] {
  return Array.from({ length: count }, () => Math.random().toString(36).slice(2, 10))
}
