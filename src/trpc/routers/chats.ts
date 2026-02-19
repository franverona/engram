import { asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { chatMessages, chats } from '@/lib/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

export const chatsRouter = createTRPCRouter({
  list: baseProcedure.query(async () => {
    return db.select().from(chats).orderBy(desc(chats.createdAt))
  }),

  create: baseProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const [chat] = db.insert(chats).values(input).returning().all()
      return chat
    }),

  delete: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      db.delete(chats).where(eq(chats.id, input.id)).run()
      return { success: true }
    }),

  getMessages: baseProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, input.chatId))
        .orderBy(asc(chatMessages.createdAt))
    }),
})
