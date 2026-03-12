'use client'

import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { MarkdownBody } from '@/components/markdown-body'
import { Kbd } from '@/components/ui/kbd'
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut'
import { trpc } from '@/trpc/react'

function TypingIndicator() {
  return (
    <div className="mr-8 flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-semibold text-text-muted">
        AI
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-surface-secondary px-4 py-3">
        <div className="flex gap-1.5">
          <span className="typing-dot h-2 w-2 rounded-full bg-text-faint" />
          <span className="typing-dot h-2 w-2 rounded-full bg-text-faint" />
          <span className="typing-dot h-2 w-2 rounded-full bg-text-faint" />
        </div>
      </div>
    </div>
  )
}

type ChatInterfaceProps = {
  chatId: number
  initialMessages: UIMessage[]
}

export function ChatInterface({ chatId, initialMessages }: ChatInterfaceProps) {
  const utils = trpc.useUtils()
  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { chatId },
    }),
  })

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useKeyboardShortcut({
    key: 'Enter',
    ctrl: true,
    meta: true,
    callback: async () => await onSendMessage(),
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  const isStreaming = status === 'streaming'

  const updateChat = trpc.chats.update.useMutation({
    onMutate: async (input) => {
      await utils.chats.list.cancel()
      const previous = utils.chats.list.getData()
      utils.chats.list.setData(undefined, (old) =>
        old?.map((c) => (c.id === input.id ? { ...c, ...input } : c)),
      )
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      utils.chats.list.setData(undefined, ctx?.previous)
    },
    onSettled: () => {
      utils.chats.list.invalidate()
    },
  })

  const generateTitle = trpc.chats.generateTitle.useMutation({
    onMutate: async (input) => {
      await utils.chats.list.cancel()
      const previous = utils.chats.list.getData()
      utils.chats.list.setData(undefined, (old) =>
        old?.map((c) => (c.id === chatId ? { ...c, title: input.message } : c)),
      )
      return { previous }
    },
    onSuccess: async (title) => {
      updateChat.mutate({ id: chatId, title })
    },
    onError: (_err, _input, ctx) => {
      utils.chats.list.setData(undefined, ctx?.previous)
    },
    onSettled: () => {
      utils.chats.list.invalidate()
    },
  })

  const onSendMessage = async () => {
    if (!input.trim()) return
    const text = input
    setInput('')

    if (messages.length === 0) {
      generateTitle.mutate({ message: text })
    }

    await sendMessage({ text })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSendMessage()
  }

  return (
    <div className="flex flex-1 flex-col relative">
      <div
        ref={scrollRef}
        className="chat-scroll bottom-0 flex-1 space-y-4 overflow-y-auto pb-28 pt-6 px-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4 text-text-faint"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-lg font-medium text-text-muted">Chat with your notes</p>
            <p className="mt-1 max-w-sm text-sm text-text-faint">
              Ask questions about your notes and the AI will use them as context to help you.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx('flex items-start gap-3', {
              'ml-8 flex-row-reverse': message.role === 'user',
              'mr-8': message.role !== 'user',
            })}
          >
            <div
              className={clsx(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                {
                  'bg-primary text-white': message.role === 'user',
                  'bg-surface-secondary text-text-muted': message.role !== 'user',
                },
              )}
            >
              {message.role === 'user' ? 'You' : 'AI'}
            </div>
            <div
              className={clsx('rounded-2xl px-4 py-3 shadow-sm', {
                'rounded-tr-sm bg-primary text-white': message.role === 'user',
                'rounded-tl-sm bg-surface-secondary': message.role !== 'user',
              })}
            >
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm text-white">
                  {message.parts
                    .filter((p) => p.type === 'text')
                    .map((p) => (p as { type: 'text'; text: string }).text)
                    .join('')}
                </p>
              ) : (
                <div className="prose-chat text-sm">
                  <MarkdownBody
                    content={message.parts
                      .filter((p) => p.type === 'text')
                      .map((p) => (p as { type: 'text'; text: string }).text)
                      .join('')}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {(status === 'submitted' || isStreaming) &&
          messages[messages.length - 1]?.role === 'user' && <TypingIndicator />}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex absolute bottom-0 left-0 w-full gap-2 px-4 py-8 bg-background"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your notes..."
          className="flex-1 rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-sm placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
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
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Send <Kbd keys={['⌘', '↵']} />
        </button>
      </form>
    </div>
  )
}
