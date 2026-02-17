import { streamText } from 'ai'
import { chatModel } from '@/lib/ai/ollama'
import { generateNoteEmbedding } from '@/lib/ai/embeddings'
import { sqlite } from '@/lib/db'
import { searchEmbeddings } from '@/lib/db/vec'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === 'user')

  let context = ''

  if (lastUserMessage) {
    const queryEmbedding = await generateNoteEmbedding(lastUserMessage.content)
    const results = searchEmbeddings(sqlite, queryEmbedding, 5)

    if (results.length > 0) {
      const noteIds = results.map((r) => r.note_id)
      const matchedNotes = await db
        .select()
        .from(notes)
        .where(inArray(notes.id, noteIds))

      context = matchedNotes
        .map((n) => `# ${n.title}\n${n.body}`)
        .join('\n\n---\n\n')
    }
  }

  const systemMessage = context
    ? `You are a helpful assistant that answers questions based on the user's notes. Use the following notes as context to answer questions. If the notes don't contain relevant information, say so.\n\n${context}`
    : 'You are a helpful assistant. The user has no notes yet, so answer questions to the best of your ability.'

  const result = streamText({
    model: chatModel,
    system: systemMessage,
    messages,
  })

  return result.toDataStreamResponse()
}
