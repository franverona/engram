import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditButton } from '@/components/action-buttons'
import { ExportButton } from '@/components/action-buttons'
import { LayoutInnerContent } from '@/components/layout'
import { MarkdownBody } from '@/components/markdown-body'
import { calcReadingTime } from '@/lib/text'
import { serverTrpc } from '@/trpc/server'

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const note = await serverTrpc.notes.getById({ id: Number(id) })

  if (!note) {
    notFound()
  }

  const readingTime = calcReadingTime(note.body)

  return (
    <LayoutInnerContent>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-text-muted hover:text-foreground">
          &larr; Back to notes
        </Link>
        <div className="flex gap-2">
          <ExportButton withLabel note={note} />
          <EditButton withLabel href={`/notes/${note.id}/edit`} />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <div className="mt-1.5 mb-4 text-xs text-text-faint">{readingTime.words} words · ~{readingTime.minutes} min read · {note.body.length} characters</div>
        {note.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-surface-secondary px-2 py-0.5 text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
        <MarkdownBody content={note.body} />
      </div>
    </LayoutInnerContent>
  )
}
