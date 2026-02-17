import { createOllama } from "ollama-ai-provider";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/api",
});

export const chatModel = ollama(
  process.env.OLLAMA_CHAT_MODEL ?? "llama3.1:8b",
);
export const embeddingModel = ollama.embedding(
  process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text",
);
