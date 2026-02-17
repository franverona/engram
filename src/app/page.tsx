import { NotesList } from '@/components/notes-list'

export default function HomePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your Notes</h1>
      <NotesList />
    </div>
  )
}
