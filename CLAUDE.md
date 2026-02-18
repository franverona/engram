# CLAUDE.md

## Project Overview

Engram is a local-first notes app with semantic search and RAG chat, built with Next.js 16 and powered by Ollama. All AI inference runs locally.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm start` — Run local environment via `zx ./local-env.mjs`
- `npm run lint` — Run ESLint
- `act pull_request` — Simulate the CI workflow locally (requires Docker + [act](https://github.com/nektos/act))
- `npx drizzle-kit push` — Push schema changes to SQLite database
- `npx drizzle-kit studio` — Open Drizzle Studio to inspect the database

## Architecture

- **Frontend**: Next.js App Router with React Server Components. Client components use tRPC + React Query for data fetching.
- **API**: tRPC handles CRUD and search. A separate `/api/chat` route uses the Vercel AI SDK v5 for streaming RAG responses.
- **Database**: SQLite via better-sqlite3 + Drizzle ORM. The `notes` table is managed by Drizzle. The `note_embeddings` table is a sqlite-vec `vec0` virtual table managed with raw SQL (Drizzle doesn't support virtual tables).
- **AI**: Ollama provides both the chat model (llama3.1:8b) and embedding model (nomic-embed-text). The embedding dimension is 768. The Ollama provider uses `@ai-sdk/openai-compatible` pointed at Ollama's OpenAI-compatible API (`/v1`).

## Key Conventions

- All server-side modules that touch the database or AI import `"server-only"` to prevent accidental client bundling.
- Environment variables are read with `process.env.VAR ?? "default"` — the app works without a `.env.local` file.
- sqlite-vec requires `BigInt` for primary key values (not plain `number`).
- `better-sqlite3` and `sqlite-vec` must stay in `serverExternalPackages` in `next.config.ts`.
- `sqliteVec.load()` is called on the raw better-sqlite3 `Database` instance, not the Drizzle wrapper.
- When passing `Float32Array` to sqlite-vec, use `Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)` to handle views correctly.
- tRPC uses `superjson` as its transformer and `zod` for input validation.
- AI SDK v5 uses `UIMessage` (with a `parts` array) instead of a flat `content` string. Use `convertToModelMessages(messages)` in route handlers to convert to model-compatible format. Stream responses with `result.toUIMessageStreamResponse()`.
- The `useChat` hook (`@ai-sdk/react` v2) requires a `transport` option (`new DefaultChatTransport({ api: '...' })`). It no longer exposes `input`/`handleInputChange`/`handleSubmit` — manage input state manually and call `sendMessage({ text })`.
- Commits follow Conventional Commits. Husky + lint-staged + commitlint enforce linting and commit message format on pre-commit/commit-msg hooks.

## File Layout

```
src/
  app/                        # Pages and API routes
    api/chat/route.ts         # Streaming RAG chat (Vercel AI SDK)
    api/trpc/[trpc]/route.ts  # tRPC fetch adapter
  components/                 # Client components (note-form, notes-list, search-bar, search-results, chat-interface)
  lib/ai/                     # ollama.ts (provider config), embeddings.ts (embed helper)
  lib/db/                     # index.ts (connection), schema.ts (Drizzle schema), vec.ts (sqlite-vec raw SQL)
  trpc/                       # init.ts, routers/, query-client.ts, server.ts, react.tsx
```
