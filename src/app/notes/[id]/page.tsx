import Link from 'next/link'
import { MarkdownBody } from '@/components/markdown-body'
import { serverTrpc } from '@/trpc/server'

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const note = await serverTrpc.notes.getById({ id: Number(id) })

  if (!note) {
    return <p>Note not found.</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-text-muted hover:text-foreground">
          &larr; Back to notes
        </Link>
        <Link
          href={`/notes/${note.id}/edit`}
          className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:border-border-hover hover:bg-surface-secondary"
        >
          Edit
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold">{note.title}</h1>
        <MarkdownBody content={note.body} />
      </div>
    </div>
  )
}
