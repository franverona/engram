'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts-modal'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'

export default function KeyboardShortcuts() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  useKeyboardShortcut({ key: 'K', ctrl: true, meta: true, callback: () => router.push('/search') })
  useKeyboardShortcut({ key: 'N', callback: () => router.push('/notes/new') })
  useKeyboardShortcut({ key: '?', callback: () => setIsOpen((v) => !v) })

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Show keyboard shortcuts"
        className="fixed bottom-4 right-4 z-40 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-xs font-medium text-text-muted shadow-sm hover:text-foreground"
      >
        ?
      </button>
      <KeyboardShortcutsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
