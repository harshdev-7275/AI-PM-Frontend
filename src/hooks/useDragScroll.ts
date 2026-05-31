import { useRef, useCallback } from 'react'

/**
 * Attach to any horizontally scrollable container.
 * Click and drag on the container background scrolls it left/right.
 * Cards still drag normally — this only activates when mousedown lands
 * directly on the container or its non-interactive children.
 */
export function useDragScroll() {
  const ref       = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX    = useRef(0)
  const scrollLeft = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only activate on the scroll container itself or empty space — not on cards
    const target = e.target as HTMLElement
    const isCard = target.closest('[data-dnd-card]')
    if (isCard) return

    const el = ref.current
    if (!el) return

    isDragging.current  = true
    startX.current      = e.pageX - el.offsetLeft
    scrollLeft.current  = el.scrollLeft
    el.style.cursor     = 'grabbing'
    el.style.userSelect = 'none'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const el = ref.current
    if (!el) return

    e.preventDefault()
    const x    = e.pageX - el.offsetLeft
    const walk = (x - startX.current) * 1.2   // 1.2 = scroll speed multiplier
    el.scrollLeft = scrollLeft.current - walk
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
    const el = ref.current
    if (!el) return
    el.style.cursor     = ''
    el.style.userSelect = ''
  }, [])

  const onMouseLeave = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    const el = ref.current
    if (!el) return
    el.style.cursor     = ''
    el.style.userSelect = ''
  }, [])

  return { ref, onMouseDown, onMouseMove, onMouseUp, onMouseLeave }
}
