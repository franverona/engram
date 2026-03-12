'use client'

import { Kbd } from '@/components/ui/kbd'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'

type ShortcutRow = {
  action: string
  keys: string[]
}

const SHORTCUTS: ShortcutRow[] = [
  { action: 'New note', keys: ['N'] },
  { action: 'Search', keys: ['⌘', 'K'] },
  { action: 'Save note', keys: ['⌘', '↵'] },
  { action: 'Cancel / go back', keys: ['Esc'] },
  { action: 'Send message', keys: ['⌘', '↵'] },
  { action: 'Show shortcuts', keys: ['?'] },
]

type KeyboardShortcutsModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useKeyboardShortcut({ key: 'Escape', callback: onClose })

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-text-faint hover:text-foreground"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(({ action, keys }) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{action}</span>
              <Kbd keys={keys} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
