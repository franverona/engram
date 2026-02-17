'use client'

import { useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'

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

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, status } =
    useChat({ api: '/api/chat' })

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  const isStreaming = status === 'streaming'

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div ref={scrollRef} className="chat-scroll flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-text-faint">
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
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'ml-8 flex-row-reverse' : 'mr-8'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-surface-secondary text-text-muted'
              }`}
            >
              {message.role === 'user' ? 'You' : 'AI'}
            </div>
            <div
              className={`rounded-2xl px-4 py-3 shadow-sm ${
                message.role === 'user'
                  ? 'rounded-tr-sm bg-primary text-white'
                  : 'rounded-tl-sm bg-surface-secondary'
              }`}
            >
              <p className={`whitespace-pre-wrap text-sm ${
                message.role === 'user' ? 'text-white' : 'text-foreground'
              }`}>
                {message.content}
              </p>
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role === 'user' && (
          <TypingIndicator />
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border pt-4">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your notes..."
          className="flex-1 rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-sm placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Send
        </button>
      </form>
    </div>
  )
}
