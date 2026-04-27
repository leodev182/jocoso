# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instala pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia manifiestos primero para aprovechar cache de capas
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copia fuentes y genera el cliente Prisma
COPY . .
RUN pnpm prisma generate
RUN pnpm build && ls -la dist/

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Solo dependencias de producción
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Artefactos del build y cliente Prisma generado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

# Config de Prisma para prod (sin ts-node) y entrypoint
COPY prisma.config.js ./prisma.config.js
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
