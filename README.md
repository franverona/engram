# Engram

A local-first notes app with hybrid search and RAG chat. Everything runs on your machine using [Ollama](https://ollama.com) for embeddings and LLM inference.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **tRPC** for type-safe API layer
- **Drizzle ORM** + **better-sqlite3** for persistence
- **sqlite-vec** for vector similarity search
- **SQLite FTS5** for lexical full-text search
- **Vercel AI SDK** + **Ollama** for embeddings and chat
- **Husky** + **lint-staged** + **commitlint** for Conventional Commits enforcement

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
cp .env.example .env.local   # optional — defaults work without it
npx drizzle-kit push          # create/migrate the database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

### Production (full stack)

Runs the Next.js app and Ollama in containers. Models are pulled automatically on first run.

```bash
mkdir -p data
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

Data persists between runs — the SQLite database is bind-mounted to `./data/` and Ollama models are stored in a named volume. Use `docker compose down -v` only if you want to wipe model storage.

### Dev (Ollama only)

Runs only Ollama in Docker while the app runs natively. Gives full hot reload speed with Metal GPU acceleration on macOS.

```bash
docker compose -f docker-compose.dev.yml up
npm run dev
```

> **Note:** On macOS, Ollama inside Docker runs on CPU only (no Metal GPU). Inference with `llama3.1:8b` will be slow. For daily development, prefer native Ollama or switch to a smaller model via `OLLAMA_CHAT_MODEL=llama3.2:3b` in `.env.local`.

## Environment Variables

See `.env.example` for all available options. Defaults work out of the box if Ollama is running locally.

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama API endpoint |
| `OLLAMA_CHAT_MODEL` | `llama3.1:8b` | Model used for RAG chat |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Model used for embeddings |
| `EMBEDDING_DIMENSION` | `768` | Vector dimension (must match embedding model) |
| `DATABASE_PATH` | `./data/engram.db` | SQLite database file path |

## Running Tests

```bash
npm test
```

## Running CI Locally

Install [act](https://github.com/nektos/act) and Docker, then:

```bash
act pull_request
```

## Project Structure

```
src/
  app/              # Next.js pages and API routes
    api/chat/       # Streaming RAG chat endpoint
    api/trpc/       # tRPC handler
    chat/           # Chat page
    notes/new/      # Create note page
    search/         # Hybrid search page
  components/       # React components
  lib/
    ai/             # Ollama provider, embedding generation
    db/             # Drizzle schema, sqlite-vec helpers, FTS5 helpers
  trpc/             # tRPC router, React provider, server helpers
data/               # SQLite database (gitignored)
scripts/
  init-ollama.sh    # Pulls required Ollama models on first Docker run
```
