import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const ollama = createOpenAICompatible({
  name: 'ollama',
  baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
})

export const chatModel = ollama(
  process.env.OLLAMA_CHAT_MODEL ?? 'llama3.1:8b',
)
export const embeddingModel = ollama.textEmbeddingModel(
  process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text',
)
