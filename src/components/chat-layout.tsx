'use client'

import type { UIMessage } from 'ai'
import clsx from 'clsx'
import { useState } from 'react'
import { trpc } from '@/trpc/react'
import { ChatInterface } from './chat-interface'

type Chat = {
  id: number
  title: string
  createdAt: string
}

export default function ChatLayout() {
  const utils = trpc.useUtils()
  const [activeChatId, setActiveChatId] = useState<number | null>(null)

  const {
    data: chats,
    isLoading: isLoadingChats,
  } = trpc.chats.list.useQuery(undefined, {
    select: (data): Chat[] => data.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt
    }))
  })

  const {
    data: chatMessages,
    isLoading: isLoadingChatMessages,
  } = trpc.chats.getMessages.useQuery({
    chatId: activeChatId!
  }, {
    enabled: activeChatId !== null,
    select: (data): UIMessage[] => data.map((msg) => ({
      id: String(msg.id),
      role: msg.role,
      parts: [{ type: 'text' as const, text: msg.content }],
    }))
  })

  const createChat =  trpc.chats.create.useMutation({
    onMutate: async (input) => {
      await utils.chats.list.cancel()
      const previous = utils.chats.list.getData()
      const tempId = -Date.now()
      const tempDate = new Date().toISOString()
      utils.chats.list.setData(undefined, (old) => [
        ...(old ?? []),
        {
          id: tempId,
          ...input,
          createdAt: tempDate,
        }
      ])
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      utils.chats.list.setData(undefined, ctx?.previous)
    },
    onSuccess: (newChat) => {
      setActiveChatId(newChat.id)
    },
    onSettled: () => {
      utils.chats.list.invalidate()
    },
  })

  const onClickStartChat = () => {
    createChat.mutate({
      title: 'New conversation'
    })
  }

  const onClickSelectChat = (chatId:number) => setActiveChatId(chatId)

  if (isLoadingChats) {
    return (
      <div className="text-center text-text-muted text-sm pt-20">
        Loading chats...
      </div>
    )
  }

  return (
    <div className="flex">
      <div className="gap-2 w-3xs pr-2 border-r border-border">
        {chats?.map((chat) => (
          <div
            key={chat.id}
            className={clsx('text-text-muted text-sm p-2 rounded-md hover:bg-gray-950 cursor-pointer truncate', {
              'font-semibold bg-gray-950': activeChatId === chat.id
            })}
            onClick={() => onClickSelectChat(chat.id)}
          >
            {chat.title}
          </div>
        ))}
      </div>
      <div className="flex-1">
        {activeChatId ? (
          <>
            {!isLoadingChatMessages && (
              <ChatInterface
                key={activeChatId}
                chatId={activeChatId}
                initialMessages={chatMessages ?? []}
              />
            )}
          </>
        ) : (
          <div className="flex gap-4 flex-col items-center justify-center h-[calc(100vh-120px)]">
            <div className="text-text-muted">
              Select a chat, or create a new one.
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              onClick={onClickStartChat}
            >
              Start chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
