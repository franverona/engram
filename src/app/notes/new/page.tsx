import Link from 'next/link'
import { LayoutInnerContent } from '@/components/layout'
import { NoteForm } from '@/components/note-form'

export default function NewNotePage() {
  return (
    <LayoutInnerContent>
      <div className="mb-6">
        <Link href="/" className="text-sm text-text-muted hover:text-foreground">
          &larr; Back to notes
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Create a Note</h1>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <NoteForm />
      </div>
    </LayoutInnerContent>
  )
}
