import Link from 'next/link'
import { LayoutInnerContent } from '@/components/layout'
import { NotesList } from '@/components/notes-list'

export default function HomePage() {
  return (
    <LayoutInnerContent>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Notes</h1>
        <Link
          href="/notes/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Note
        </Link>
      </div>
      <NotesList />
    </LayoutInnerContent>
  )
}
