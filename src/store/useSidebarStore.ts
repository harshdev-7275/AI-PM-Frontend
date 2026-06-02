import { create } from 'zustand'

/**
 * Sidebar UI state — separate from URL state so the collapse/expand
 * choice survives navigation between routes.
 *
 * Session-only for now. If we need persistence later, swap to the same
 * persist + Zod pattern we use in useTheme.
 */
interface SidebarState {
  isCollapsed: boolean
  toggle:      () => void
  setCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed:   false,
  toggle:        (): void => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setCollapsed:  (collapsed: boolean): void => set({ isCollapsed: collapsed }),
}))
