# Produccion

## Arquitectura

DigitalOcean ejecuta Docker Compose con estos servicios:

- `backend`: NestJS en el puerto interno `3000`.
- `postgres`: PostgreSQL persistido en `postgres_data`.
- `redis`: Redis/BullMQ para trabajos de stock y ordenes ML.
- `nginx`: reverse proxy publico para `backend.jocoso.cl`.
- `certbot`: renovacion de certificados.

La ruta del checkout en el servidor es `/opt/jocoso/jocoso`.

## Despliegue sin migracion

No usar `docker compose down`: interrumpe innecesariamente Nginx, Redis y PostgreSQL.

```bash
cd /opt/jocoso/jocoso
git fetch origin
git pull --ff-only origin main
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d --no-deps backend
curl -fsS https://backend.jocoso.cl/api/v1/health
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

## Despliegue con migracion

Respaldar antes de tocar el esquema. El `--entrypoint node` evita arrancar una segunda instancia de NestJS durante la migracion.

```bash
cd /opt/jocoso/jocoso
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres -d jocoso | gzip > "backup-jocoso-$(date +%Y%m%d-%H%M%S).sql.gz"
git fetch origin
git pull --ff-only origin main
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml run --rm --no-deps \
  --entrypoint node backend node_modules/.bin/prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d --no-deps backend
curl -fsS https://backend.jocoso.cl/api/v1/health
```

## Nginx y SSL

No reemplazar `nginx/default.conf` ni borrar `certbot_conf/` durante un deploy del backend. La configuracion de Nginx y los certificados son estado operativo del servidor y pueden estar staged localmente aunque no formen parte del ultimo commit.

El deploy normal solo recrea `backend`; Nginx sigue atendiendo HTTPS y proxificando `/api/v1/*`.

## BullMQ y contenedores temporales

No dejar contenedores `jocoso-backend-run-*` activos. Un contenedor temporal viejo puede consumir jobs con codigo anterior y competir con `jocoso_backend`.

```bash
docker ps --filter "name=jocoso-backend-run"
docker stop $(docker ps -q --filter "name=jocoso-backend-run")
```

No detener `jocoso_backend`, `jocoso_db`, `jocoso_redis`, `jocoso_nginx` ni `jocoso_certbot` con ese filtro.

## Verificacion ML

Despues de una migracion de aliases:

1. Verificar `MlListing` y `MlListingVariant` en PostgreSQL.
2. Asociar publicaciones adicionales desde Ops con **Agregar publicacion**.
3. No usar **Desvincular todas** para reemplazar una publicacion.
4. Reconciliar solo despues de confirmar mappings.
5. Revisar logs de `ML webhook`, `MlOrderProcessor`, `StockSync` y `SyncLocalStockToMlUseCase`.

El backend es la autoridad del stock. Una venta ML descuenta Jocoso una sola vez y luego BullMQ publica el stock local en todas las publicaciones asociadas.
