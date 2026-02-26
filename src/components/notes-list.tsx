'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useToast } from '@/components/toast'
import type { notes } from '@/lib/db/schema'
import { trpc } from '@/trpc/react'
import { DeleteButton, EditButton, ExportButton, PinButton, SummarizeButton } from './action-buttons'
import { Spinner } from './ui'

function stripMarkdown(text: string): string {
  return text
    .replace(/^```[\s\S]*?^```/gm, '')        // fenced code blocks (multi-line)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images → alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')  // links → label
    .replace(/^#{1,6}\s+/gm, '')              // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2')       // bold
    .replace(/([*_])(.*?)\1/g, '$2')          // italic
    .replace(/~~(.*?)~~/g, '$1')              // strikethrough
    .replace(/`[^`]*`/g, '')                  // inline code
    .replace(/^>\s+/gm, '')                   // blockquotes
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

const isSummaryStale = (updatedAt: string, summarizedAt: string) => updatedAt > summarizedAt

type SortByFields = 'createdAt' | 'updatedAt' | 'title'

type Note = typeof notes.$inferSelect

export function NotesList() {
  const [sortBy, setSortBy] = useState<SortByFields>('updatedAt')
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = trpc.notes.list.useInfiniteQuery(
    { sortBy },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  )
  const notesList = data?.pages.flatMap((page) => page.items) ?? []

  const { data: allTags } = trpc.tags.list.useQuery()
  const utils = trpc.useUtils()
  const { showToast } = useToast()

  const pendingDeletes = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const [summarizingIds, setSummarizingIds] = useState<Set<number>>(new Set())
  const [pinningIds, setPinningIds] = useState<Set<number>>(new Set())
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const deleteNote = trpc.notes.delete.useMutation({
    onError: () => {
      utils.notes.list.invalidate()
      showToast('Failed to delete note')
    },
    onSettled: (_d, _e, input) => {
      utils.notes.list.invalidate()
      pendingDeletes.current.delete(input.id)
    },
  })

  const summarizeNote = trpc.notes.summarize.useMutation({
    onMutate: (input) => {
      setSummarizingIds(prev => new Set(prev).add(input.id))
    },
    onError: () => {
      showToast('An error occurred when generating the summary')
    },
    onSuccess: () => {
      showToast('Summary created successfully')
    },
    onSettled: (_note, _err, variables) => {
      utils.notes.list.invalidate()
      setSummarizingIds(prev => {
        const next = new Set(prev)
        next.delete(variables.id)
        return next
      })
    },
  })

  const pinNote = trpc.notes.pin.useMutation({
    onMutate: async (input) => {
      setPinningIds(prev => new Set(prev).add(input.id))
      await utils.notes.list.cancel()
      const previous = utils.notes.list.getInfiniteData({ sortBy })
      utils.notes.list.setInfiniteData({}, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((n) => n.id === input.id ? { ...n, pinned: input.pinned } : n),
          })),
        }
      })
      return { previous }
    },
    onError: (_e, input, ctx) => {
      utils.notes.list.setInfiniteData({ sortBy }, ctx?.previous)
      showToast(input.pinned ? 'An error occurred when pinning the note' : 'An error occurred when unpinning the note')
    },
    onSuccess: (data) => {
      showToast(data.pinned ? 'Note pinned' : 'Note unpinned')
    },
    onSettled: (_note, _err, variables) => {
      utils.notes.list.invalidate()
      setPinningIds(prev => {
        const next = new Set(prev)
        next.delete(variables.id)
        return next
      })
    },
  })

  const handleDelete = async (note: Note) => {
    await utils.notes.list.cancel()
    const previous = utils.notes.list.getInfiniteData({ sortBy })
    utils.notes.list.setInfiniteData({}, (old) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.filter((n) => n.id !== note.id),
        })),
      }
    })
    showToast('Note deleted', () => {
      const timeout = pendingDeletes.current.get(note.id)
      if (timeout) {
        clearTimeout(timeout)
      }
      utils.notes.list.setInfiniteData(undefined, previous)
      pendingDeletes.current.delete(note.id)
    })
    const deleteTimeout = setTimeout(() => {
      deleteNote.mutate({ id: note.id })
    }, 5000)
    pendingDeletes.current.set(note.id, deleteTimeout)
  }

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

  const filtered = selectedTags.length === 0
    ? notesList
    : notesList.filter((note) => selectedTags.every((t) => note.tags.includes(t)))

  const toggleTag = (name: string) =>
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )

  return (
    <>
      <div className="mb-2 text-right">
        <div className="flex justify-end items-center gap-4">
          <label htmlFor="sortBy" className="block text-sm font-medium">
            Sort by:
          </label>
          <select id="sortBy" className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm shadow-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortByFields)}>
            <option value="updatedAt">Update date</option>
            <option value="createdAt">Create date</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>
      {allTags && allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.name)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTags.includes(tag.name)
                  ? 'bg-primary text-white'
                  : 'bg-surface-secondary text-text-muted hover:text-foreground'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
      <ul className="space-y-3">
        {filtered.length === 0 && selectedTags.length > 0 && (
          <p className="text-sm text-text-muted">No notes match the selected tags.</p>
        )}
        {filtered.map((note) => (
          <li
            key={note.id}
            className="group rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-border-hover hover:shadow-md"
          >
            <div className="flex flex-col items-start justify-between gap-4">
              <div className="min-w-0 w-full">
                <div className="flex items-center justify-between gap-4">
                  <Link href={`/notes/${note.id}`} className="inline-flex gap-2 flex-1 font-semibold leading-snug hover:text-primary truncate">
                    {note.pinned && (
                      <span className="text-yellow-300 pt-0.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" x2="12" y1="17" y2="22" fill="none" />
                          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0
  4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                        </svg>
                      </span>
                    )}
                    <span className="truncate">
                      {note.title}
                    </span>
                  </Link>
                  <div className="flex gap-2 items-center shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <PinButton
                      pinned={note.pinned}
                      onClick={() => pinNote.mutate({ id: note.id, pinned: !note.pinned })}
                      isPending={pinningIds.has(note.id)}
                    />
                    <ExportButton note={note} />
                    <SummarizeButton
                      exists={!!note.summary}
                      onClick={() => summarizeNote.mutate({ id: note.id })}
                      isPending={summarizingIds.has(note.id)}
                    />
                    <EditButton href={`/notes/${note.id}/edit`} />
                    <DeleteButton
                      onConfirm={async () => await handleDelete(note)}
                    />
                  </div>
                </div>
                <div className="mt-2 line-clamp-4 text-sm text-text-muted">
                  {summarizingIds.has(note.id) ? (
                    <Spinner />
                  ) : (
                    <>{note.summary || stripMarkdown(note.body)}</>
                  )}
                </div>
                {note.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-surface-secondary px-2 py-0.5 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2.5 flex items-center gap-2">
                  <p className="text-xs text-text-faint">Last update: {timeAgo(note.updatedAt)}</p>
                  {!summarizingIds.has(note.id) && (
                    <>
                      {note.summarizedAt && isSummaryStale(note.updatedAt, note.summarizedAt) && (
                        <>
                          <div className="text-xs text-text-faint">·</div>
                          <div className="flex gap-2 items-center text-xs rounded-sm px-2 py-1 font-medium bg-amber-300 text-amber-900">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <span>Summary may be outdated</span>
                          </div>
                        </>
                      )}
                      {!note.summarizedAt && (
                        <>
                          <div className="text-xs text-text-faint">·</div>
                          <div className="flex gap-2 items-center text-xs rounded-sm px-2 py-1 font-medium bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-300">
                            No summary yet
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <div className="text-center mt-8">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </>
  )
}
