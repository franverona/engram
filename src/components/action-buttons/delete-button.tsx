'use client'

import type { ActionButtonBaseProps } from './action-button'
import ActionButton from './action-button'

export default function DeleteButton({
  onConfirm,
  withLabel,
}: ActionButtonBaseProps & {
  onConfirm: () => void
}) {
  return (
    <ActionButton
      onClick={onConfirm}
      className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
      aria-label="Delete note"
      label={withLabel ? 'Delete' : undefined}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </ActionButton>
  )
}
