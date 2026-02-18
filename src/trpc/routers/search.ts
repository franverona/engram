import { inArray } from 'drizzle-orm'
import { z } from 'zod'
import { generateNoteEmbedding } from '@/lib/ai/embeddings'
import { db, sqlite } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { searchEmbeddings } from '@/lib/db/vec'
import { baseProcedure, createTRPCRouter } from '../init'

export const searchRouter = createTRPCRouter({
  semantic: baseProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const queryEmbedding = await generateNoteEmbedding(input.query)
      const results = searchEmbeddings(sqlite, queryEmbedding, input.limit)

      if (results.length === 0) return []

      const noteIds = results.map((r) => r.note_id)
      const matchedNotes = await db
        .select()
        .from(notes)
        .where(inArray(notes.id, noteIds))

      const distanceMap = new Map(
        results.map((r) => [r.note_id, r.distance]),
      )

      return matchedNotes
        .map((note) => ({
          ...note,
          distance: distanceMap.get(note.id) ?? 1,
        }))
        .sort((a, b) => a.distance - b.distance)
    }),
})
