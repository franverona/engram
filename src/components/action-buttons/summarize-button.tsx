import type { ActionButtonBaseProps } from './action-button'
import ActionButton from './action-button'

export default function SummarizeButton({
  exists,
  onClick,
  isPending,
  withLabel,
}: ActionButtonBaseProps & {
  exists: boolean
  onClick: () => void
  isPending: boolean
}) {
  return (
    <ActionButton
      disabled={isPending}
      onClick={onClick}
      className="hover:bg-fuchsia-50 hover:text-fuchsia-600 dark:hover:bg-fuchsia-950 dark:hover:text-fuchsia-400"
      aria-label={exists ? 'Regenerate summary' : 'Summarize note'}
      title={exists ? 'Regenerate summary' : 'Summarize note'}
      label={withLabel ? 'Summarize' : undefined}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135
  1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
        <path d="M20 3v4"/>
        <path d="M22 5h-4"/>
        <path d="M4 17v2"/>
        <path d="M5 18H3"/>
      </svg>
    </ActionButton>
  )
}
