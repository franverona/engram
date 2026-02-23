import { useEffect, useRef } from 'react'

type UseKeyboardShortcutOptions = {
  key: string
  meta?: boolean
  ctrl?: boolean
  callback: () => void
}

export function useKeyboardShortcut({ key, meta, ctrl, callback }: UseKeyboardShortcutOptions) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === key.toLowerCase()) {
        const modifierRequired = meta || ctrl
        const modifierPressed = (meta && e.metaKey) || (ctrl && e.ctrlKey)

        const tag = document.activeElement?.tagName.toLowerCase()
        const isEditable = document.activeElement?.getAttribute('contenteditable') === 'true'
        const isInputFocused = tag === 'input' || tag === 'textarea' || isEditable
        if (modifierRequired ? modifierPressed : !isInputFocused) {
          e.preventDefault()
          callbackRef.current()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, meta, ctrl])
}
