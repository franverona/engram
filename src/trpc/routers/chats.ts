import { asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { generateChatMessageSummary } from '@/lib/ai/summary'
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

  update: baseProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const [updated] = db
        .update(chats)
        .set({ title: input.title })
        .where(eq(chats.id, input.id))
        .returning().all()
      return updated
    }),

  delete: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      db.delete(chats).where(eq(chats.id, input.id)).run()
      return { success: true }
    }),

  getMessages: baseProcedure
    .input(z.object({ chatId: z.number() }))
    .query(({ input }) => {
      return db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, input.chatId))
        .orderBy(asc(chatMessages.createdAt))
    }),

  generateTitle: baseProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const title = await generateChatMessageSummary(input.message.trim())
      return title.replace(/[".]/g, '').trim()
    })
})
