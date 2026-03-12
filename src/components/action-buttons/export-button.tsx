'use client'

import type { notes } from '@/lib/db/schema'
import { downloadFile, slugify } from '@/lib/export'
import type { ActionButtonBaseProps } from './action-button'
import ActionButton from './action-button'

export default function ExportButton({
  note,
  withLabel,
}: ActionButtonBaseProps & {
  note: typeof notes.$inferSelect
}) {
  const onClick = () => {
    const file = {
      name: `${slugify(note.title)}.md`,
      content: `# ${note.title}\n\n${note.body}`,
    }
    downloadFile(file.name, file.content)
  }

  return (
    <ActionButton
      onClick={onClick}
      className="hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950 dark:hover:text-violet-400"
      aria-label="Export note"
      title="Export note"
      label={withLabel ? 'Export' : undefined}
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </ActionButton>
  )
}
