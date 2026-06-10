import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * SSR-safe (returns `false` on the server) and tears down its listener on
 * unmount. Built on useSyncExternalStore so the value is always in sync with
 * the browser — no effect-driven re-render after mount.
 *
 * Usage:
 *   const isDesktop = useMediaQuery('(min-width: 768px)')
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
