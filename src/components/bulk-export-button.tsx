'use client'

import JSZip from 'jszip'
import { downloadFile, slugify } from '@/lib/export'
import { trpc } from '@/trpc/react'

export default function BulkExportButton() {
  const { data: notesList, isLoading } = trpc.notes.list.useQuery()
  const onClick = async () => {
    if (!notesList || notesList.length === 0) {
      return
    }

    const zip = new JSZip()
    for (const note of notesList) {
      const file = {
        name: `${slugify(note.title)}-${note.id}.md`,
        content: `# ${note.title}\n\n${note.body}`
      }
      zip.file(file.name, file.content)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadFile(`engram-export-${new Date().valueOf()}.zip`, blob, 'application/zip')
  }

  return (
    <button
      disabled={isLoading || notesList?.length === 0}
      onClick={onClick}
      className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      aria-label="Export all notes"
      title="Export all notes"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
        <path d="M3 4h18a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="12" y1="20" x2="12" y2="20" />
      </svg>
      Export all
    </button>
  )
}
