'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/components/toast'
import { trpc } from '@/trpc/react'

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images → alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')  // links → label
    .replace(/^#{1,6}\s+/gm, '')              // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2')       // bold
    .replace(/([*_])(.*?)\1/g, '$2')          // italic
    .replace(/~~(.*?)~~/g, '$1')              // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, '')        // inline code / fenced code
    .replace(/^```[\s\S]*?```$/gm, '')         // code blocks
    .replace(/^>\s+/gm, '')                    // blockquotes
    .replace(/^[-*+]\s+/gm, '')               // unordered list markers
    .replace(/^\d+\.\s+/gm, '')               // ordered list markers
    .replace(/^-{3,}$/gm, '')                 // horizontal rules
    .replace(/\n{2,}/g, ' ')                  // collapse blank lines
    .trim()
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 w-1/3 animate-pulse rounded bg-border" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-border" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-border" />
          <div className="mt-3 h-3 w-20 animate-pulse rounded bg-border" />
        </div>
      </div>
    </div>
  )
}

function EditButton({ href }: { href: string }) {
  return (
    <Link
      aria-label="Edit note"
      href={href}
      className="rounded-md p-1.5 text-text-faint hover:bg-lime-50 hover:text-lime-600 dark:hover:bg-lime-950 dark:hover:text-lime-400"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0
  .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
        <path d="m15 5 4 4"/>
      </svg>
    </Link>
  )
}

function DeleteButton({ onConfirm, isPending }: { onConfirm: () => void, isPending: boolean }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => { onConfirm(); setConfirming(false) }}
          disabled={isPending}
          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? 'Deleting...' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md p-1.5 text-text-faint hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
      aria-label="Delete note"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  )
}

export function NotesList() {
  const { data: notesList, isLoading } = trpc.notes.list.useQuery()
  const utils = trpc.useUtils()
  const { showToast } = useToast()

  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate()
      showToast('Note deleted successfully')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!notesList?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-text-faint">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <p className="text-lg font-medium text-text-muted">No notes yet</p>
        <p className="mt-1 text-sm text-text-faint">Create your first note to get started</p>
        <Link
          href="/notes/new"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Note
        </Link>
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-3">
        {notesList.map((note) => (
          <li
            key={note.id}
            className="group rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-border-hover hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link href={`/notes/${note.id}`} className="font-semibold leading-snug hover:text-primary">
                  {note.title}
                </Link>
                <p className="mt-1.5 line-clamp-3 text-sm text-text-muted">
                  {stripMarkdown(note.body)}
                </p>
                <p className="mt-2.5 text-xs text-text-faint">{timeAgo(note.createdAt)}</p>
              </div>
              <div className="flex gap-2 items-center shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                <EditButton href={`/notes/${note.id}/edit`} />
                <DeleteButton
                  onConfirm={() => deleteNote.mutate({ id: note.id })}
                  isPending={deleteNote.isPending}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
