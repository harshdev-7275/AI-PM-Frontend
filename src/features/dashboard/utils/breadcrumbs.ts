import type { Project } from '@/types'

export interface Crumb {
  label: string
}

// Top-level section segment → display label. Mirrors NAV_ITEMS + Settings.
const SECTION_LABELS: Record<string, string> = {
  dashboard:      'Boards',
  issues:         'Issues',
  sprints:        'Sprints',
  'ai-assistant': 'AI Assistant',
  analytics:      'Analytics',
  settings:       'Settings',
}

const PROJECT_SUBPAGE_LABELS: Record<string, string> = {
  board:   'Board',
  backlog: 'Backlog',
}

/**
 * Builds the breadcrumb trail shown after the org root in the topbar,
 * derived purely from the current pathname.
 *
 *   /acme/issues            → [{ label: 'Issues' }]
 *   /acme/projects/p1/board → [{ label: 'Core' }, { label: 'Board' }]
 *
 * Returns [] for the org root or any unrecognised section, so the topbar
 * just shows the org name.
 *
 * @param pathname - The current location pathname (e.g. from useLocation).
 * @param projects - Projects used to resolve a project id to its name.
 */
export function buildBreadcrumbs(
  pathname: string,
  projects: readonly Pick<Project, 'id' | 'name'>[],
): Crumb[] {
  const segments = pathname.split('/').filter(Boolean) // [slug, section, ...]
  const section = segments[1]
  if (!section) return []

  if (section === 'projects') {
    const project = projects.find((p) => p.id === segments[2])
    const crumbs: Crumb[] = [{ label: project?.name ?? 'Project' }]
    const subpageLabel = segments[3] ? PROJECT_SUBPAGE_LABELS[segments[3]] : undefined
    if (subpageLabel) crumbs.push({ label: subpageLabel })
    return crumbs
  }

  const label = SECTION_LABELS[section]
  return label ? [{ label }] : []
}
