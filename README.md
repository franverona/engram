# Engram

A local-first notes app with semantic search and RAG chat. Everything runs on your machine using [Ollama](https://ollama.com) for embeddings and LLM inference.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **tRPC** for type-safe API layer
- **Drizzle ORM** + **better-sqlite3** for persistence
- **sqlite-vec** for vector similarity search
- **Vercel AI SDK** + **Ollama** for embeddings and chat

## Prerequisites

- Node.js 20+
- [Ollama](https://ollama.com) installed and running

Pull the required models:

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

## Setup

```bash
npm install
cp .env.example .env.local   # edit if needed
npx drizzle-kit push          # create/migrate the database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.example` for all available options. Defaults work out of the box if Ollama is running locally.

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434/api` | Ollama API endpoint |
| `OLLAMA_CHAT_MODEL` | `llama3.1:8b` | Model used for RAG chat |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Model used for embeddings |
| `EMBEDDING_DIMENSION` | `768` | Vector dimension (must match embedding model) |
| `DATABASE_PATH` | `./data/engram.db` | SQLite database file path |

## Project Structure

```
src/
  app/              # Next.js pages and API routes
    api/chat/       # Streaming RAG chat endpoint
    api/trpc/       # tRPC handler
    chat/           # Chat page
    notes/new/      # Create note page
    search/         # Semantic search page
  components/       # React components
  lib/
    ai/             # Ollama provider, embedding generation
    db/             # Drizzle schema, sqlite-vec helpers
  trpc/             # tRPC router, React provider, server helpers
data/               # SQLite database (gitignored)
```
