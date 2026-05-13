# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instala pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copia manifiestos primero para aprovechar cache de capas
COPY package.json pnpm-lock.yaml .pnpmfile-build-approvals.json ./
RUN pnpm install --no-frozen-lockfile

# Copia fuentes y genera el cliente Prisma
COPY . .
RUN pnpm prisma generate
RUN pnpm build && ls -la dist/

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Artefactos del build, node_modules y cliente Prisma desde el builder
COPY --from=builder /app/node_modules ./node_modules
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
