import { inArray } from 'drizzle-orm'
import { z } from 'zod'
import { generateNoteEmbedding } from '@/lib/ai/embeddings'
import { db, sqlite } from '@/lib/db'
import { sanitizeFtsQuery, searchFts, type SearchFtsResult } from '@/lib/db/fts'
import { notes } from '@/lib/db/schema'
import { searchEmbeddings } from '@/lib/db/vec'
import { baseProcedure, createTRPCRouter } from '../init'

const calcRRF = (index: number) => 1 / (60 + (index + 1))

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
          distance: distanceMap.get(note.id) ?? 0,
        }))
        .sort((a, b) => a.distance - b.distance)
    }),
  hybrid: baseProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().optional() }))
    .query(async ({ input }) => {
      let ftsResults: SearchFtsResult[] = []
      try {
        ftsResults = searchFts(sqlite, sanitizeFtsQuery(input.query), input.limit)
      } catch (err) {
        // malformed FTS5 query — skip lexical leg
        if (process.env.NODE_ENV === 'development') {
          console.warn('[FTS] query failed, skipping lexical leg:', err)
        }
      }

      const queryEmbedding = await generateNoteEmbedding(input.query)
      const vectorResults = searchEmbeddings(sqlite, queryEmbedding, input.limit)

      // RRF
      const rrfMatches = new Map<number, number>()
      ftsResults.forEach((r, index) => {
        rrfMatches.set(r.note_id, (rrfMatches.get(r.note_id) ?? 0) + calcRRF(index))
      })
      vectorResults.forEach((r, index) => {
        rrfMatches.set(r.note_id, (rrfMatches.get(r.note_id) ?? 0) + calcRRF(index))
      })

      const noteIds = rrfMatches.keys().toArray()
      if (noteIds.length === 0) {
        return []
      }

      const matchedNotes = await db
        .select()
        .from(notes)
        .where(inArray(notes.id, noteIds))

      return matchedNotes
        .map((note) => ({
          ...note,
          score: rrfMatches.get(note.id) ?? 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, input.limit ?? 5)
    }),
})
