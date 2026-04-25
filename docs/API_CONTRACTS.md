# Jocoso.cl — Contratos de API

Base URL: `https://api.jocoso.cl/api/v1`  
Autenticación: `Authorization: Bearer <accessToken>` en todos los endpoints protegidos.

---

## Índice

- [Conceptos clave](#conceptos-clave)
- [Autenticación — compartida](#autenticación--compartida-admin--web)
- [WEB — jocoso.cl (Astro)](#web--jocosocl-astro)
- [ADMIN — admin.jocoso.cl (Angular)](#admin--adminjocosocl-angular)
- [Webhooks externos (MP y ML)](#webhooks-externos-no-llaman-los-fronts)
- [Producto → MercadoLibre: cómo se relacionan](#producto--mercadolibre-cómo-se-relacionan)
- [Flujo de login: Customer vs Admin](#flujo-de-login-customer-vs-admin)

---

## Conceptos clave

| Concepto | Descripción |
|---|---|
| `accessToken` | JWT válido 15 min. Se envía en `Authorization: Bearer`. |
| `refreshToken` | Token opaco válido 7 días. Se rota en cada uso. |
| Roles | `ADMIN` · `SUPPORT` · `CUSTOMER` |
| UUID | Todos los IDs son UUID v4. |

---

## Autenticación — compartida (Admin + Web)

El mismo sistema de auth sirve a ambos frontends. La diferencia es el **rol** del usuario en el JWT.

### `POST /auth/register`
Crea cuenta CUSTOMER. Solo usar en jocoso.cl (web). Los admins se crean por seed/script.

**Request**
```json
{
  "email": "usuario@ejemplo.cl",
  "password": "MiPassword123!"
}
```
Reglas password: mínimo 12 chars, mayúscula + minúscula + número + carácter especial.

**Response 201**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "a1b2c3...",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.cl",
    "role": "CUSTOMER"
  }
}
```

---

### `POST /auth/login`
Login para **cualquier rol**. El frontend detecta el rol y redirige al panel correcto.

**Request**
```json
{
  "email": "admin@jocoso.cl",
  "password": "AdminPassword123!"
}
```

**Response 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "a1b2c3...",
  "user": {
    "id": "uuid",
    "email": "admin@jocoso.cl",
    "role": "ADMIN"
  }
}
```

---

### `POST /auth/refresh`
Rota el refresh token. Llamar antes de que expire el accessToken.

**Request**
```json
{ "refreshToken": "a1b2c3..." }
```

**Response 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "nuevo-token..."
}
```

---

### `POST /auth/logout`
Revoca el refresh token.  
Requiere: `Authorization: Bearer <accessToken>`

**Request**
```json
{ "refreshToken": "a1b2c3..." }
```

**Response 204** — sin body.

---

### `POST /auth/2fa/setup`
Inicia configuración de 2FA. Devuelve el QR para Google Authenticator.  
Requiere: `Authorization: Bearer <accessToken>`

**Response 200**
```json
{
  "secret": "BASE32SECRET",
  "otpauthUrl": "otpauth://totp/Jocoso:email@example.cl?secret=..."
}
```

---

### `POST /auth/2fa/verify`
Verifica el código TOTP y activa 2FA en la cuenta.  
Requiere: `Authorization: Bearer <accessToken>`

**Request**
```json
{ "token": "123456" }
```

**Response 200**
```json
{ "message": "2FA enabled" }
```

---

## WEB — jocoso.cl (Astro)

Endpoints que consume la tienda pública. El usuario autenticado tiene rol `CUSTOMER`.

### Catálogo

#### `GET /products/:id`
Ver detalle de un producto. Registra visita automáticamente (fire-and-forget).  
Requiere: `Authorization: Bearer` (cualquier rol)

**Response 200**
```json
{
  "id": "uuid",
  "title": "Zapatilla Running Pro",
  "description": "Descripción del producto",
  "status": "ACTIVE",
  "mlItemId": "MLC123456",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "variants": [
    {
      "id": "uuid",
      "sku": "ZAP-RUN-42-BLK",
      "price": "89990",
      "stock": 15,
      "mlVariationId": "123456789",
      "attributes": [
        { "name": "talla", "value": "42" },
        { "name": "color", "value": "negro" }
      ]
    }
  ]
}
```

---

### Órdenes

#### `POST /orders`
Crea una orden. El `userId` se extrae del JWT automáticamente.  
Requiere: `Authorization: Bearer`

**Request**
```json
{
  "items": [
    { "variantId": "uuid-variant", "quantity": 2 }
  ]
}
```

**Response 201**
```json
{
  "id": "uuid-order",
  "userId": "uuid-user",
  "status": "PENDING",
  "totalAmount": "179980",
  "items": [
    {
      "id": "uuid-item",
      "orderId": "uuid-order",
      "variantId": "uuid-variant",
      "quantity": 2,
      "price": "89990"
    }
  ],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

---

#### `GET /orders/my`
Historial de órdenes del usuario autenticado.  
Requiere: `Authorization: Bearer`

**Response 200** — array de órdenes (mismo shape que arriba, sin items detallados).

---

#### `GET /orders/:id`
Detalle de una orden. CUSTOMER solo puede ver las suyas.  
Requiere: `Authorization: Bearer`

**Response 200** — misma estructura que `POST /orders`.  
**Response 403** — si el CUSTOMER intenta ver una orden de otro usuario.

---

### Pagos

#### `POST /payments/orders/:orderId`
Inicia el pago de una orden. Crea la preferencia en MercadoPago y devuelve la URL de checkout.  
Requiere: `Authorization: Bearer`

**Response 201**
```json
{
  "paymentId": "uuid-payment",
  "checkoutUrl": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=..."
}
```

El frontend redirige al usuario a `checkoutUrl`. MP procesa el pago y notifica al backend vía webhook.

---

#### `POST /payments/:id/cancel`
Cancela un pago en estado PENDING.  
Requiere: `Authorization: Bearer`

**Response 204** — sin body.

---

## ADMIN — admin.jocoso.cl (Angular)

Endpoints exclusivos de roles `ADMIN` y `SUPPORT`. El login es el mismo `POST /auth/login` — Angular detecta `role: "ADMIN"` en la respuesta y activa el panel.

### Productos

#### `GET /products?status=ACTIVE`
Lista todos los productos. Parámetro `status` opcional: `ACTIVE` · `INACTIVE` · `PAUSED`.  
Roles: `ADMIN`, `SUPPORT`

**Response 200** — array de productos (sin variants).

---

#### `POST /products`
Crea un producto en el sistema interno. **No publica en ML todavía.**  
Roles: `ADMIN`

**Request**
```json
{
  "title": "Zapatilla Running Pro",
  "description": "Descripción opcional"
}
```

**Response 201**
```json
{
  "id": "uuid",
  "title": "Zapatilla Running Pro",
  "description": "Descripción opcional",
  "status": "ACTIVE",
  "mlItemId": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

---

#### `POST /products/:id/variants`
Agrega una variante a un producto.  
Roles: `ADMIN`

**Request**
```json
{
  "sku": "ZAP-RUN-42-BLK",
  "price": 89990,
  "attributes": [
    { "name": "talla", "value": "42" },
    { "name": "color", "value": "negro" }
  ]
}
```

**Response 201** — variante creada con `stock: 0` y `mlVariationId: null`.

---

#### `GET /products/trending?period=7d&limit=10`
Top N productos por vistas en el período indicado.  
Períodos: `7d` · `30d` · `90d`  
Roles: `ADMIN`, `SUPPORT`

**Response 200**
```json
[
  {
    "id": "uuid",
    "title": "Zapatilla Running Pro",
    "status": "ACTIVE",
    "views": 342,
    "createdAt": "..."
  }
]
```

---

### Stock

#### `GET /stock/:variantId`
Nivel de stock actual de una variante.  
Roles: `ADMIN`, `SUPPORT`

**Response 200**
```json
{ "variantId": "uuid", "stock": 15 }
```

---

#### `GET /stock/:variantId/movements?limit=50`
Historial de movimientos de stock.  
Roles: `ADMIN`, `SUPPORT`

**Response 200**
```json
[
  {
    "id": "uuid",
    "variantId": "uuid",
    "quantity": -2,
    "source": "WEB",
    "referenceType": "ORDER",
    "referenceId": "uuid-order",
    "externalId": null,
    "createdAt": "..."
  }
]
```

---

#### `POST /stock/increase`
Aumenta stock manualmente (reposición, corrección).  
Roles: `ADMIN`

**Request**
```json
{
  "variantId": "uuid",
  "quantity": 50,
  "source": "ADMIN",
  "referenceType": "MANUAL",
  "referenceId": "OC-2026-001"
}
```

**Response 204** — sin body.

Valores válidos:
- `source`: `WEB` · `ML` · `ADMIN`
- `referenceType`: `ORDER` · `ML_SALE` · `MANUAL`

---

#### `POST /stock/decrease`
Disminuye stock manualmente.  
Roles: `ADMIN`

**Request** — mismo shape que `increase`.  
**Response 204** — sin body.

---

### MercadoLibre — integración

#### `GET /ml/oauth/authorize`
Redirige al admin a la pantalla de autorización de ML. Solo se hace una vez para conectar la cuenta vendedor.  
Roles: `ADMIN`

**Response 302** — redirect a `auth.mercadolibre.cl/authorization?...`

---

#### `POST /ml/products/:productId/sync`
Publica un producto existente en MercadoLibre. Guarda `mlItemId` y `mlVariationId` en la DB.  
Roles: `ADMIN`

**Request**
```json
{
  "mlCategoryId": "MLC1055",
  "condition": "new",
  "listingType": "gold_special"
}
```

**Response 200**
```json
{ "mlItemId": "MLC123456789" }
```

---

## Webhooks externos (no llaman los fronts)

Estos endpoints los llaman MercadoPago y MercadoLibre, no el frontend.

| Endpoint | Caller | Descripción |
|---|---|---|
| `POST /payments/webhook` | MercadoPago | Notifica aprobación/rechazo de pago |
| `POST /ml/webhooks` | MercadoLibre | Notifica nueva venta en ML |

---

## Producto → MercadoLibre: cómo se relacionan

```
[Admin crea producto]          [Admin sincroniza a ML]
POST /products          →      POST /ml/products/:id/sync
     ↓                                   ↓
 id: "uuid"                    Publica en ML API
 mlItemId: null                Recibe mlItemId + mlVariationId
 mlVariationId: null           Los persiste en la DB
                                         ↓
                               Producto ahora tiene:
                               mlItemId: "MLC123456"
                               mlVariationId: "987654321"
```

**Por qué el flujo es así:**

1. **ML no es la fuente de verdad** — el sistema interno es el maestro. ML es un canal de venta.
2. Puedes tener productos sin ML (venta solo web) y productos con ML (multicanal).
3. Una vez sincronizado, el puente queda establecido por `mlVariationId`:
   - Cuando baja el stock en tu sistema → el backend actualiza ML automáticamente.
   - Cuando llega una venta desde ML (webhook) → el backend busca la variante por `mlVariationId`, crea la orden interna y descuenta el stock.
4. El stock siempre se mueve en el sistema interno primero. ML refleja lo que tu sistema dice.

---

## Flujo de login: Customer vs Admin

**Es el mismo endpoint** `POST /auth/login`. La diferencia es el rol del usuario en la DB.

```
                    POST /auth/login
                    { email, password }
                           ↓
                  ┌────────────────────┐
                  │  Verifica password  │
                  │  Genera JWT         │
                  └────────────────────┘
                           ↓
              JWT payload: { id, email, role }
                           ↓
            ┌──────────────┴──────────────┐
            │                             │
       role: CUSTOMER               role: ADMIN / SUPPORT
            │                             │
     jocoso.cl (Astro)         admin.jocoso.cl (Angular)
     Accede a catálogo,         Accede a dashboard,
     órdenes propias,           productos, stock,
     checkout                   reportes, ML sync
```

**¿Tiene algo que ver con MercadoLibre?**
No. El login de customers y admins es 100% propio (email + password + JWT). MercadoLibre solo aparece en:
- La OAuth2 del **vendedor** (el admin conecta la cuenta ML una sola vez via `/ml/oauth/authorize`).
- Los webhooks de ventas que ML envía al backend.

El customer nunca interactúa con ML directamente. Compra en jocoso.cl → paga con MercadoPago → listo.

**Google OAuth** — no está implementado aún. Se puede agregar como estrategia adicional de Passport sin tocar la lógica actual.

**2FA** — disponible para cualquier rol. Recomendado activarlo para cuentas ADMIN.
