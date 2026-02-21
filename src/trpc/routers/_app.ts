import { createTRPCRouter } from '../init'
import { chatsRouter } from './chats'
import { notesRouter } from './notes'
import { searchRouter } from './search'
import { tagsRouter } from './tags'

export const appRouter = createTRPCRouter({
  notes: notesRouter,
  search: searchRouter,
  chats: chatsRouter,
  tags: tagsRouter,
})

export type AppRouter = typeof appRouter
