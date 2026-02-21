import { TRPCError } from '@trpc/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { generateNoteEmbedding } from '@/lib/ai/embeddings'
import { generateNoteSummary } from '@/lib/ai/summary'
import { db, sqlite } from '@/lib/db'
import { deleteFts, upsertFts } from '@/lib/db/fts'
import { notes, noteTags, tags } from '@/lib/db/schema'
import { upsertEmbedding, deleteEmbedding } from '@/lib/db/vec'
import { baseProcedure, createTRPCRouter } from '../init'

export const notesRouter = createTRPCRouter({
  list: baseProcedure.query(async () => {
    const notesList = await db.select().from(notes).orderBy(desc(notes.createdAt))
    if (notesList.length === 0) {
      return []
    }

    const noteIds = notesList.map((n) => n.id)
    const noteTagsResults = db.select({
      noteId: noteTags.noteId,
      name: tags.name,
    })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(inArray(noteTags.noteId, noteIds))
      .all()

    const tagsByNoteId = noteTagsResults.reduce((acc, row) => {
      const existing = acc.get(row.noteId) ?? []
      acc.set(row.noteId, [...existing, row.name])
      return acc
    }, new Map<number, string[]>())

    return notesList.map((note) => ({
      ...note,
      tags: tagsByNoteId.get(note.id) ?? [],
    }))
  }),

  getById: baseProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const rows = db.select({
        note: notes,
        tagName: tags.name,
      })
        .from(notes)
        .leftJoin(noteTags, eq(noteTags.noteId, notes.id))
        .leftJoin(tags, eq(tags.id, noteTags.tagId))
        .where(eq(notes.id, input.id))
        .all()

      if (rows.length === 0) return null

      return {
        ...rows[0].note,
        tags: rows.map(r => r.tagName).filter(Boolean) as string[],
      }
    }),

  create: baseProcedure
    .input(z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      tags: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      const embedding = await generateNoteEmbedding(`${input.title}\n${input.body}`)
      const [note] = sqlite.transaction(() => {
        const { tags: tagNames, ...noteData } = input
        const [note] = db.insert(notes).values(noteData).returning().all()
        if (tagNames.length > 0) {
          const tagIds = tagNames.map((name) => {
            db.insert(tags).values({ name }).onConflictDoNothing().run()
            const tag = db.select().from(tags).where(eq(tags.name, name)).get()!
            return tag.id
          })
          db.insert(noteTags).values(
            tagIds.map((tagId) => ({ noteId: note.id, tagId }))
          ).run()
        }
        upsertEmbedding(sqlite, note.id, embedding)
        upsertFts(sqlite, note.id, input.title, input.body)
        return [note]
      })()
      return note
    }),

  update: baseProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1),
      body: z.string().min(1),
      tags: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      const embedding = await generateNoteEmbedding(`${input.title}\n${input.body}`)
      const [updated] = sqlite.transaction(() => {
        const [updated] = db
          .update(notes)
          .set({
            title: input.title,
            body: input.body
          })
          .where(eq(notes.id, input.id))
          .returning()
          .all()

        db.delete(noteTags).where(eq(noteTags.noteId, updated.id)).run()
        if (input.tags.length > 0) {
          const tagIds = input.tags.map((name) => {
            db.insert(tags).values({ name }).onConflictDoNothing().run()
            const tag = db.select().from(tags).where(eq(tags.name, name)).get()!
            return tag.id
          })
          if (tagIds.length > 0) {
            db.insert(noteTags).values(
              tagIds.map((tagId) => ({ noteId: updated.id, tagId }))
            ).run()
          }
        }

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
        deleteEmbedding(sqlite, input.id)
        deleteFts(sqlite, input.id)
        db.delete(notes).where(eq(notes.id, input.id)).run()
      })()
      return { success: true }
    }),

  summarize: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await db
        .select()
        .from(notes)
        .where(eq(notes.id, input.id))
      const note = result[0] ?? null
      if (!note) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const summary = await generateNoteSummary(note.title, note.body)
      const now = new Date().toISOString()
      const [updated] = db
        .update(notes)
        .set({
          summary,
          summarizedAt: now,
          updatedAt: now, // forced here to make both dates the same (avoiding $onUpdate)
        })
        .where(eq(notes.id, input.id))
        .returning()
        .all()
      return updated
    }),

})
