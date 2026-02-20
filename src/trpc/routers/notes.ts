import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { generateNoteEmbedding } from '@/lib/ai/embeddings'
import { db, sqlite } from '@/lib/db'
import { deleteFts, upsertFts } from '@/lib/db/fts'
import { notes } from '@/lib/db/schema'
import { upsertEmbedding, deleteEmbedding } from '@/lib/db/vec'
import { baseProcedure, createTRPCRouter } from '../init'

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
      const embedding = await generateNoteEmbedding(`${input.title}\n${input.body}`)
      const [note] = sqlite.transaction(() => {
        const [note] = db.insert(notes).values(input).returning().all()
        upsertEmbedding(sqlite, note.id, embedding)
        upsertFts(sqlite, note.id, input.title, input.body)
        return [note]
      })()
      return note
    }),

  update: baseProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1), body: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const embedding = await generateNoteEmbedding(`${input.title}\n${input.body}`)
      const [updated] = sqlite.transaction(() => {
        const [updated] = db.update(notes).set({ title: input.title, body: input.body }).where(eq(notes.id, input.id)).returning().all()
        upsertEmbedding(sqlite, updated.id, embedding)
        upsertFts(sqlite, updated.id, input.title, input.body)
        return [updated]
      })()
      return updated
    }),

  delete: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      sqlite.transaction(() => {
        const result = db.select().from(notes).where(eq(notes.id, input.id)).all()
        const note = result[0] ?? null
        if (note) {
          deleteEmbedding(sqlite, note.id)
          deleteFts(sqlite, note.id, note.title, note.body)
          db.delete(notes).where(eq(notes.id, note.id)).run()
        }
      })()
      return { success: true }
    }),
})
