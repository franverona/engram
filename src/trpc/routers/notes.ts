import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { baseProcedure, createTRPCRouter } from '../init'
import { db, sqlite } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { upsertEmbedding, deleteEmbedding } from '@/lib/db/vec'
import { generateNoteEmbedding } from '@/lib/ai/embeddings'

export const notesRouter = createTRPCRouter({
  list: baseProcedure.query(async () => {
    return db.select().from(notes).orderBy(notes.createdAt)
  }),

  getById: baseProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(notes)
        .where(eq(notes.id, input.id))
      return result[0] ?? null
    }),

  create: baseProcedure
    .input(z.object({ title: z.string().min(1), body: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const [note] = await db.insert(notes).values(input).returning()

      const embedding = await generateNoteEmbedding(
        `${note.title}\n${note.body}`,
      )
      upsertEmbedding(sqlite, note.id, embedding)

      return note
    }),

  delete: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      deleteEmbedding(sqlite, input.id)
      await db.delete(notes).where(eq(notes.id, input.id))
      return { success: true }
    }),
})
