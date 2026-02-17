import 'server-only'
import { embed } from 'ai'
import { embeddingModel } from './ollama'

export async function generateNoteEmbedding(
  text: string,
): Promise<Float32Array> {
  const { embedding } = await embed({ model: embeddingModel, value: text })
  return new Float32Array(embedding)
}
