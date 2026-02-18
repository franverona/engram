import Link from 'next/link'
import { NoteForm } from '@/components/note-form'
import { serverTrpc } from '@/trpc/server'

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const {id} = await params
  const note = await serverTrpc.notes.getById({ id: Number(id) })

  if (!note) {
    return <p>Note not found.</p>
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-text-muted hover:text-foreground">
          &larr; Back to notes
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Update Note</h1>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <NoteForm
          initialId={note.id}
          initialTitle={note.title}
          initialBody={note.body}
        />
      </div>
    </div>
  )
}
