# CLAUDE.md

## Project Overview

Engram is a local-first notes app with semantic search and RAG chat, built with Next.js 16 and powered by Ollama. All AI inference runs locally.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm start` — Run local environment via `zx ./local-env.mjs`
- `npm run lint` — Run ESLint
- `npm test` — Run unit tests (Vitest)
- `npm run test:watch` — Run tests in watch mode
- `act pull_request` — Simulate the CI workflow locally (requires Docker + [act](https://github.com/nektos/act))
- `npx drizzle-kit push` — **Broken** — see note below
- `npx drizzle-kit studio` — **Broken** — see note below
- `docker compose up --build` — Start full stack in Docker (app + Ollama)
- `docker compose -f docker-compose.dev.yml up` — Start only Ollama in Docker (app runs natively)

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
- `INSERT OR REPLACE` raises a `UNIQUE constraint` error on `vec0` virtual tables. Use a delete-then-insert wrapped in a transaction instead.
- tRPC uses `superjson` as its transformer and `zod` for input validation.
- AI SDK v5 uses `UIMessage` (with a `parts` array) instead of a flat `content` string. Use `convertToModelMessages(messages)` in route handlers to convert to model-compatible format. Stream responses with `result.toUIMessageStreamResponse()`.
- The `useChat` hook (`@ai-sdk/react` v2) requires a `transport` option (`new DefaultChatTransport({ api: '...' })`). It no longer exposes `input`/`handleInputChange`/`handleSubmit` — manage input state manually and call `sendMessage({ text })`.
- Commits follow Conventional Commits. Husky + lint-staged + commitlint enforce linting and commit message format on pre-commit/commit-msg hooks.

## Schema Changes

`drizzle-kit push` is broken for this project — it opens the database without loading sqlite-vec, hits the `note_embeddings` vec0 virtual table during introspection, and crashes. Apply schema changes with raw SQL instead:

```bash
sqlite3 ./data/engram.db "CREATE TABLE ..."
```

`drizzle-kit studio` has the same problem and is also broken. `drizzle-kit generate` (generates migration SQL files without connecting to the DB) still works. To inspect the database use the `sqlite3` CLI or a GUI tool like [TablePlus](https://tableplus.com) or [DB Browser for SQLite](https://sqlitebrowser.org).

## Docker

- `next.config.ts` has `output: 'standalone'` — required for the multi-stage Docker build to produce a lean runtime image.
- `DATABASE_PATH=:memory:` is set in the Dockerfile builder stage so `npm run build` doesn't fail — Next.js spawns 9 parallel workers to collect page data, all of which open the same SQLite file and cause `SQLITE_BUSY` errors. In-memory databases are isolated per-worker.
- The Next.js standalone dependency tracer doesn't pick up `sqlite-vec-linux-arm64` (dynamically loaded extension). It must be manually copied into the runner stage via `COPY --from=builder`.
- Use `node:24-slim` (Debian/glibc), not `node:24-alpine` (musl) — pre-built binaries for `better-sqlite3` and `sqlite-vec` target glibc and won't load on Alpine.
- `postcss.config.mjs` must NOT be excluded in `.dockerignore` — it's required at build time for Tailwind CSS to generate styles. Avoid `*.mjs` wildcards; list dev-only `.mjs` files explicitly instead.
- On macOS, Ollama in Docker runs on CPU only (no Metal GPU). Inference is significantly slower than native. For development, prefer native Ollama or use a smaller model (`llama3.2:3b`).

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
scripts/
  init-ollama.sh              # Pulls llama3.1:8b and nomic-embed-text on first Docker run
Dockerfile                    # Multi-stage build: deps → builder → runner
docker-compose.yml            # Production: app + ollama services
docker-compose.dev.yml        # Dev: ollama only (app runs natively)
```
