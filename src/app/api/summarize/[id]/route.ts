import 'server-only'
import { streamText } from 'ai'
import { eq } from 'drizzle-orm'
import { chatModel } from '@/lib/ai/ollama'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) return Response.json({ error: 'Invalid ID' }, { status: 400 })

  const note = await db
    .select()
    .from(notes)
    .where(eq(notes.id, id))
    .then((r) => r[0])
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 })

  const result = streamText({
    model: chatModel,
    prompt: `Return a one-sentence summary for this note. I only want the summary, do not add anything additional:\n\n${note.title}\n${note.body}`,
    onFinish: async ({ text }) => {
      const now = new Date().toISOString()
      await db
        .update(notes)
        .set({
          summary: text,
          summarizedAt: now,
          updatedAt: now,
        })
        .where(eq(notes.id, id))
    },
  })

  return result.toTextStreamResponse()
}
