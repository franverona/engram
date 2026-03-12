import type { ActionButtonBaseProps } from './action-button'
import ActionButton from './action-button'

export default function EditButton({
  href,
  withLabel,
}: ActionButtonBaseProps & {
  href: string
}) {
  return (
    <ActionButton
      aria-label="Edit note"
      href={href}
      className="group flex items-center gap-0 rounded-md p-1.5 text-text-faint hover:bg-lime-50 hover:text-lime-600 dark:hover:bg-lime-950 dark:hover:text-lime-400"
      label={withLabel ? 'Edit' : undefined}
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
        <path
          d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0
  .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
        />
        <path d="m15 5 4 4" />
      </svg>
    </ActionButton>
  )
}
