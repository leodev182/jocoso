#!/bin/bash

echo "🚀 Creando estructura de proyecto..."

# ===== BASE =====
mkdir -p src/modules
mkdir -p src/integrations
mkdir -p src/domain/entities
mkdir -p src/domain/services
mkdir -p src/domain/value-objects
mkdir -p src/application/use-cases
mkdir -p src/infrastructure/db/postgres
mkdir -p src/infrastructure/queue
mkdir -p src/infrastructure/logging
mkdir -p src/interfaces/http/controllers

# ===== MODULES =====
for module in products stock orders payments admin; do
  mkdir -p src/modules/$module

  touch src/modules/$module/$module.module.ts
  touch src/modules/$module/$module.service.ts
done

# ===== INTEGRATIONS =====
mkdir -p src/integrations/mercadolibre
mkdir -p src/integrations/mercadopago

touch src/integrations/mercadolibre/ml.service.ts
touch src/integrations/mercadolibre/ml.client.ts

touch src/integrations/mercadopago/mp.service.ts
touch src/integrations/mercadopago/mp.client.ts

# ===== DOMAIN =====
touch src/domain/entities/product.entity.ts
touch src/domain/entities/product-variant.entity.ts
touch src/domain/entities/order.entity.ts
touch src/domain/entities/stock.entity.ts
touch src/domain/entities/stock-movement.entity.ts

touch src/domain/services/stock.domain.service.ts

# ===== APPLICATION =====
touch src/application/use-cases/create-order.usecase.ts
touch src/application/use-cases/adjust-stock.usecase.ts
touch src/application/use-cases/sync-ml-stock.usecase.ts

# ===== INFRASTRUCTURE =====
touch src/infrastructure/db/postgres/product.repository.ts
touch src/infrastructure/db/postgres/stock.repository.ts
touch src/infrastructure/db/postgres/order.repository.ts

touch src/infrastructure/queue/stock-sync.processor.ts

touch src/infrastructure/logging/logger.service.ts

# ===== INTERFACES =====
touch src/interfaces/http/controllers/products.controller.ts
touch src/interfaces/http/controllers/admin.controller.ts
touch src/interfaces/http/controllers/orders.controller.ts
touch src/interfaces/http/controllers/payments.controller.ts

echo "✅ Estructura creada correctamente"