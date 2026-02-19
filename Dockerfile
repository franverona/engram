# Deps Stage
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm ci

# Builder Stage
FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p data
ENV DATABASE_PATH=:memory:
RUN npm run build

# Runner Stage
FROM node:24-slim AS runner
WORKDIR /app
RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone/ ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static/ .next/static/
COPY --chown=nextjs:nodejs --from=builder /app/public/ public/
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/sqlite-vec ./node_modules/sqlite-vec
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/sqlite-vec-linux-arm64 ./node_modules/sqlite-vec-linux-arm64
USER nextjs
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
