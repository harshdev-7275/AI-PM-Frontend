import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query client — single instance for the app.
 *
 * Config decisions:
 * - staleTime: 2 min — board/backlog data is refetched on mutation, so a short
 *   window of staleness is acceptable and avoids refetch storms on navigation
 * - retry: 1 — one retry for transient network errors, no more
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
})
