import { useEffect } from 'react'

interface KeyboardShortcutOptions {
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: KeyboardShortcutOptions = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      const metaKey = isMac ? event.metaKey : event.ctrlKey

      const matchesModifiers =
        (options.ctrlKey === undefined || metaKey === options.ctrlKey) &&
        (options.shiftKey === undefined || event.shiftKey === options.shiftKey) &&
        (options.altKey === undefined || event.altKey === options.altKey)

      if (event.key.toLowerCase() === key.toLowerCase() && matchesModifiers) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, options])
}
