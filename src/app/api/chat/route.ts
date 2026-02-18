import { convertToModelMessages, streamText } from 'ai'
import { inArray } from 'drizzle-orm'
import { generateNoteEmbedding } from '@/lib/ai/embeddings'
import { mmr } from '@/lib/ai/mmr'
import { chatModel } from '@/lib/ai/ollama'
import { db, sqlite } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { getEmbeddingsByIds, searchEmbeddings } from '@/lib/db/vec'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === 'user')

  let context = ''

  if (lastUserMessage) {
    const textContent = (lastUserMessage.parts as Array<{ type: string, text?: string }>)
      ?.filter((p) => p.type === 'text')
      .map((p) => p.text ?? '')
      .join('') ?? ''
    const queryEmbedding = await generateNoteEmbedding(textContent)

    const candidates = searchEmbeddings(sqlite, queryEmbedding, 20)
    if (candidates.length > 0) {
      const embeddings = getEmbeddingsByIds(sqlite, candidates.map((c) => c.note_id))

      const embeddingMap = new Map(
        embeddings.map((e) => [
          e.note_id,
          new Float32Array(
            e.embedding.buffer,
            e.embedding.byteOffset,
            e.embedding.byteLength / Float32Array.BYTES_PER_ELEMENT
          )
        ])
      )

      const candidatesWithEmbeddings = candidates
        .filter((c) => embeddingMap.has(c.note_id))
        .map((c) => ({ note_id: c.note_id, embedding: embeddingMap.get(c.note_id)! }))

      const noteIds = mmr(queryEmbedding, candidatesWithEmbeddings, 5)

      if (noteIds.length > 0) {
        const matchedNotes = await db
          .select()
          .from(notes)
          .where(inArray(notes.id, noteIds))

        context = matchedNotes
          .map((n) => `# ${n.title}\n${n.body}`)
          .join('\n\n---\n\n')
      }
    }
  }

  const systemMessage = context
    ? `You are a helpful assistant that answers questions based on the user's notes. Use the following notes as context to answer questions. If the notes don't contain relevant information, say so.\n\n${context}`
    : 'You are a helpful assistant. The user has no notes yet, so answer questions to the best of your ability.'

  const result = streamText({
    model: chatModel,
    system: systemMessage,
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
