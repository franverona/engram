'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MarkdownBody } from '@/components/markdown-body'
import { useToast } from '@/components/toast'
import { Kbd } from '@/components/ui/kbd'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { calcReadingTime } from '@/lib/text'
import { trpc } from '@/trpc/react'

type NoteFormProps = {
  initialBody?: string
  initialTitle?: string
  initialId?: number
  initialTags?: string[]
}

export function NoteForm({ initialBody, initialId, initialTitle, initialTags }: NoteFormProps) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const { showToast } = useToast()
  const [title, setTitle] = useState(initialTitle || '')
  const [body, setBody] = useState(initialBody || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialTags ?? [])
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  useKeyboardShortcut({
    key: 'Enter',
    ctrl: true,
    meta: true,
    callback: () => onSave(),
  })

  useKeyboardShortcut({
    key: 'Escape',
    callback: () => router.push('/'),
  })

  const updateNote = trpc.notes.update.useMutation({
    onMutate: async (input) => {
      await utils.notes.list.cancel()
      const previous = utils.notes.list.getInfiniteData()
      utils.notes.list.setInfiniteData({}, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((n) => (n.id === input.id ? { ...n, ...input } : n)),
          })),
        }
      })
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      utils.notes.list.setInfiniteData(undefined, ctx?.previous)
    },
    onSuccess: () => {
      showToast('Note updated successfully')
      router.push('/')
    },
    onSettled: () => {
      utils.notes.list.invalidate()
    },
  })

  const createNote = trpc.notes.create.useMutation({
    onError: () => {
      showToast('Failed to create note')
    },
    onSuccess: () => {
      showToast('Note created successfully')
      router.push('/')
    },
    onSettled: () => {
      utils.notes.list.invalidate()
    },
  })

  const onSave = () => {
    if (initialId) {
      updateNote.mutate({ id: initialId, title, body, tags })
    } else {
      createNote.mutate({ title, body, tags })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave()
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const value = tagInput.trim().toLowerCase()
      if (value && !tags.includes(value)) {
        setTags([...tags, value])
      }
      setTagInput('')
    }
  }

  const isPending = createNote.isPending || updateNote.isPending
  const error = createNote.error || updateNote.error

  const readingTime = calcReadingTime(body)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Give your note a title..."
          className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-sm placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Tags</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-0.5 text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="text-text-faint hover:text-foreground"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tags.length === 0 ? 'Add tags (press Enter or ,)' : ''}
            className="min-w-24 flex-1 bg-transparent text-sm placeholder:text-text-faint focus:outline-none"
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTab('edit')}
              className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${tab === 'edit' ? 'bg-surface-secondary text-foreground' : 'text-text-muted hover:text-foreground'}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${tab === 'preview' ? 'bg-surface-secondary text-foreground' : 'text-text-muted hover:text-foreground'}`}
            >
              Preview
            </button>
          </div>
          <span className="text-xs text-text-faint">
            {readingTime.words} words · ~{readingTime.minutes} min read · {body.length} characters
          </span>
        </div>
        {tab === 'edit' ? (
          <textarea
            id="body"
            aria-label="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={10}
            placeholder="Write your note..."
            className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-sm placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <div className="mt-1.5 min-h-58 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5">
            {body.trim() ? (
              <MarkdownBody content={body} />
            ) : (
              <p className="text-text-faint">Nothing to preview.</p>
            )}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending || !title.trim() || !body.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                className="opacity-25"
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                className="opacity-75"
              />
            </svg>
            Saving...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {initialId ? 'Save changes' : 'Save Note'} <Kbd keys={['⌘', '↵']} />
          </>
        )}
      </button>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error.message}
        </p>
      )}
    </form>
  )
}
