# E-commerce frontend

Frontend de tienda en Next.js 16 (App Router) y TypeScript. Las lecturas de la
API se hacen desde Server Components; las mutaciones usan Server Actions. El
backend Laravel calcula el precio y valida inventario: el navegador solo envía
identificadores de producto y cantidades.

## Requisitos

- Node.js compatible con Next.js 16
- API Laravel disponible
- Claves publicables de Stripe para el entorno de prueba o producción

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env.local` y configura:

   ```dotenv
   API_BASE_URL=http://127.0.0.1:8000/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
   ```

   `API_BASE_URL` debe apuntar al prefijo API de Laravel. La clave publicable
   `pk_...` se puede exponer al navegador; nunca pongas una clave secreta `sk_...`
   en variables `NEXT_PUBLIC_*` ni en este repositorio. La clave secreta solo
   corresponde al backend.

3. Inicia Next.js:

   ```bash
   npm run dev
   ```

   Abre `http://localhost:3000`. Para validar una compilación de producción,
   ejecuta `npm run build` y luego `npm run start`.

## Rutas

- `/`: catálogo público.
- `/productos/[id]`: detalle y acción para agregar al carrito.
- `/login` y `/register`: autenticación.
- `/checkout`: resumen y pago con Stripe Elements.
- `/checkout/success`: confirmación posterior a un pago exitoso.
- `/dashboard/ordenes`: historial protegido.

## Flujo de compra

1. El carrito se mantiene en `localStorage`, pero el precio mostrado allí es solo
   informativo.
2. Stripe Elements recoge la tarjeta en sus campos seguros. Stripe.js crea un
   `paymentMethodId` (`pm_...`); los datos de tarjeta nunca se envían a Laravel ni
   a una Server Action.
3. La primera acción envía al backend solo `{ product_id, quantity }`, crea la
   orden y solicita el pago con `{ order_id, payment_method_id }`. Laravel debe
   recalcular el total, verificar inventario y autorizar que la orden pertenezca
   al usuario autenticado.
4. Si el cobro falla después de crear la orden, el carrito se conserva y el
   frontend guarda el `orderId` para los reintentos de pago; esos reintentos usan
   la orden existente y no crean otra.
5. Si no se puede confirmar si Laravel alcanzó a crear la orden, el botón queda
   bloqueado para evitar crear duplicados. Se debe revisar el historial o
   contactar soporte antes de reintentar.
6. El carrito se limpia únicamente cuando la acción devuelve pago confirmado
   (`succeeded`). El frontend no crea sesiones de Stripe Checkout: ese flujo
   requeriría soporte adicional del backend.

## API consumida

La integración espera el contrato de la API Laravel:

- `GET /products` y `GET /products/{id}`
- `POST /auth/register` y `POST /auth/login`
- `POST /orders` con `items: [{ product_id, quantity }]`
- `POST /payments/process` con `order_id` y `payment_method_id`
- `GET /orders` para el historial del usuario

Las rutas de órdenes y pago requieren el token `jwt_token` en cookie httpOnly.
Confirma los nombres de campos y las respuestas con el Swagger de la instancia
Laravel que se vaya a usar.

## Rendimiento y pruebas

El catálogo y el historial usan Server Components y `Suspense`; catálogo y
checkout tienen `loading.tsx`, y los segmentos correspondientes tienen
`error.tsx`. Las acciones revalidan rutas afectadas.

Antes de adjuntar evidencia Lighthouse, inicia el backend y Next.js en un entorno
representativo; luego ejecuta Lighthouse desde Chrome DevTools en la ruta `/` y
guarda el reporte HTML o una captura con la URL, fecha y métricas visibles.
Documenta también la ruta y el perfil usado (móvil o escritorio). El repositorio
no incluye un reporte Lighthouse generado todavía.

Comprobaciones locales:

```bash
npm run lint
npx tsc --noEmit
npm run build
```
