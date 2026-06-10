import { describe, it, expect } from 'vitest'
import type { Issue } from '@/types'
import { buildDragUpdate } from './useBoardData'

const issue = {
  id: 'i1', statusId: 's-todo', categoryId: 'c-auth',
} as Issue

describe('buildDragUpdate — payload for a board card drop', () => {
  it('returns only statusId when the card moved columns within its lane', () => {
    expect(buildDragUpdate(issue, 's-done', 'c-auth')).toEqual({ statusId: 's-done' })
  })

  it('returns only categoryId when the card moved lanes within its column', () => {
    expect(buildDragUpdate(issue, 's-todo', 'c-pay')).toEqual({ categoryId: 'c-pay' })
  })

  it('returns both when the card moved lane and column at once', () => {
    expect(buildDragUpdate(issue, 's-done', 'c-pay')).toEqual({ statusId: 's-done', categoryId: 'c-pay' })
  })

  it('returns null when the card was dropped where it already was', () => {
    expect(buildDragUpdate(issue, 's-todo', 'c-auth')).toBeNull()
  })
})
