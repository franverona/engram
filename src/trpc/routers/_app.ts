import { createTRPCRouter } from '../init'
import { chatsRouter } from './chats'
import { notesRouter } from './notes'
import { searchRouter } from './search'

export const appRouter = createTRPCRouter({
  notes: notesRouter,
  search: searchRouter,
  chats: chatsRouter,
})

export type AppRouter = typeof appRouter
