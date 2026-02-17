'use client'

import { useChat } from '@ai-sdk/react'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, status } =
    useChat({ api: '/api/chat' })

  return (
    <div className="flex h-[600px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <p className="text-gray-500">
            Ask questions about your notes. The AI will use your notes as
            context.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded p-3 ${
              message.role === 'user'
                ? 'ml-8 bg-blue-50 dark:bg-blue-950'
                : 'mr-8 bg-gray-50 dark:bg-gray-800'
            }`}
          >
            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              {message.role === 'user' ? 'You' : 'AI'}
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
              {message.content}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your notes..."
          className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
