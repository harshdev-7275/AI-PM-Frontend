import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useSidebarStore } from './useSidebarStore'

describe('useSidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.setState({ isCollapsed: false })
  })

  it('defaults to expanded', () => {
    expect(useSidebarStore.getState().isCollapsed).toBe(false)
  })

  it('toggles between collapsed and expanded', () => {
    act(() => useSidebarStore.getState().toggle())
    expect(useSidebarStore.getState().isCollapsed).toBe(true)

    act(() => useSidebarStore.getState().toggle())
    expect(useSidebarStore.getState().isCollapsed).toBe(false)
  })

  it('setCollapsed sets the value directly', () => {
    act(() => useSidebarStore.getState().setCollapsed(true))
    expect(useSidebarStore.getState().isCollapsed).toBe(true)

    act(() => useSidebarStore.getState().setCollapsed(false))
    expect(useSidebarStore.getState().isCollapsed).toBe(false)
  })
})
