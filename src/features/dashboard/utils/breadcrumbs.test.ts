import { describe, it, expect } from 'vitest'
import { buildBreadcrumbs } from './breadcrumbs'

const projects = [
  { id: 'p1', name: 'Core' },
  { id: 'p2', name: 'Website' },
]

describe('buildBreadcrumbs', () => {
  it('returns no crumbs at the org root', () => {
    expect(buildBreadcrumbs('/acme', projects)).toEqual([])
  })

  it('maps a known top-level section to its label', () => {
    expect(buildBreadcrumbs('/acme/dashboard', projects)).toEqual([{ label: 'Boards' }])
    expect(buildBreadcrumbs('/acme/issues', projects)).toEqual([{ label: 'Issues' }])
    expect(buildBreadcrumbs('/acme/ai-assistant', projects)).toEqual([{ label: 'AI Assistant' }])
    expect(buildBreadcrumbs('/acme/settings/members', projects)).toEqual([{ label: 'Settings' }])
  })

  it('resolves a project id to its name and appends the sub-page', () => {
    expect(buildBreadcrumbs('/acme/projects/p1/board', projects)).toEqual([
      { label: 'Core' },
      { label: 'Board' },
    ])
    expect(buildBreadcrumbs('/acme/projects/p2/backlog', projects)).toEqual([
      { label: 'Website' },
      { label: 'Backlog' },
    ])
  })

  it('falls back to "Project" when the id is unknown', () => {
    expect(buildBreadcrumbs('/acme/projects/zzz/board', [])).toEqual([
      { label: 'Project' },
      { label: 'Board' },
    ])
  })

  it('returns no crumbs for an unrecognised section', () => {
    expect(buildBreadcrumbs('/acme/whatever', projects)).toEqual([])
  })
})
