'use client'

import { trpc } from '@/trpc/react'

export function NotesList() {
  const { data: notesList, isLoading } = trpc.notes.list.useQuery()
  const utils = trpc.useUtils()

  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: () => utils.notes.list.invalidate(),
  })

  if (isLoading) return <p className="text-gray-500">Loading notes...</p>
  if (!notesList?.length)
    return <p className="text-gray-500">No notes yet. Create one!</p>

  return (
    <ul className="space-y-4">
      {notesList.map((note) => (
        <li
          key={note.id}
          className="rounded border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{note.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                {note.body}
              </p>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{note.createdAt}</p>
            </div>
            <button
              onClick={() => deleteNote.mutate({ id: note.id })}
              disabled={deleteNote.isPending}
              className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
