import type { ActionButtonBaseProps } from './action-button'
import ActionButton from './action-button'

export default function PinButton({
  pinned,
  onClick,
  isPending,
  withLabel,
}: ActionButtonBaseProps & {
  pinned: boolean
  onClick: () => void
  isPending: boolean
}) {
  return (
    <ActionButton
      disabled={isPending}
      onClick={onClick}
      className="hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-950 dark:hover:text-yellow-400"
      aria-label={pinned ? 'Unpin note' : 'Pin note'}
      title={pinned ? 'Unpin note' : 'Pin note'}
      label={withLabel ? (pinned ? 'Unpin' : 'Pin') : undefined}
    >
      {pinned ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="17" y2="22" fill="none" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0
  4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="17" y2="22" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0
  4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
      )}
    </ActionButton>
  )
}
