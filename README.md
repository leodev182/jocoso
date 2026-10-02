# Backend Jocoso

API NestJS del ecosistema Jocoso. Centraliza autenticacion, catalogo, stock, pedidos, pagos, MercadoLibre, BullMQ y persistencia PostgreSQL.

## Stack

- NestJS 11
- Prisma 7 + PostgreSQL 17
- Redis 7 + BullMQ
- JWT, refresh tokens, Google OAuth y TOTP
- Docker Compose para desarrollo y produccion

## Desarrollo

```bash
pnpm install
pnpm start:dev
```

Variables principales en `.env`:

- `DATABASE_URL`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REDIRECT_URI`
- `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS`, `FRONTEND_URL`, `OPS_URL`
- `SENTRY_DSN` opcional

## Comandos

```bash
pnpm build
pnpm test
pnpm exec jest --runInBand
pnpm prisma generate --schema=prisma/schema.prisma
pnpm prisma migrate deploy --schema=prisma/schema.prisma
```

La suite completa puede contener mocks antiguos de pagos; los flujos de stock y MercadoLibre deben probarse de forma independiente cuando esos mocks estén desactualizados.

## API y salud

- Salud: `GET /api/v1/health`
- Swagger: `/api/docs`
- Swagger JSON: `/api/docs-json`
- API base: `https://backend.jocoso.cl/api/v1`

Los endpoints protegidos usan `Authorization: Bearer <accessToken>`.

## Stock y MercadoLibre

Jocoso es la autoridad del stock. MercadoLibre es un canal de venta.

- Un producto puede tener varias publicaciones ML mediante `MlListing`.
- Cada publicación puede mapear sus variantes mediante `MlListingVariant`.
- `orders_v2` identifica la venta, descuenta stock local una vez e inicia la sincronizacion saliente.
- BullMQ publica el stock local en todas las publicaciones asociadas.
- `items` y `stock` se aceptan como señales externas, pero no convierten a ML en la fuente de verdad.
- La reconciliacion busca ordenes pagadas perdidas y muestra procesadas, omitidas y errores.

## Produccion

La guia paso a paso esta en [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). El backend se ejecuta en `/opt/jocoso/jocoso` en DigitalOcean, detras de Nginx y HTTPS.

No usar `docker compose down` para un deploy normal. Reconstruir y recrear solo `backend` con `--no-deps`.
