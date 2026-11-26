# E-commerce frontend

Frontend de tienda en Next.js 16 (App Router) y TypeScript. Las lecturas de la
API se hacen desde Server Components; las mutaciones usan Server Actions. El
backend Laravel calcula el precio y valida inventario: el navegador solo envía
identificadores de producto y cantidades.

## Requisitos

- Node.js compatible con Next.js 16
- PHP 8.2 o superior, Composer y MySQL para ejecutar el backend local
- Una cuenta Stripe en modo de prueba para completar pagos

## Preparar el backend local

En una terminal, ve a la carpeta `ecommerce-api-secure` (la API Laravel que
acompaña este frontend) y ejecuta:

```bash
composer install
```

Copia `.env.example` a `.env` y configura la conexión MySQL. Crea antes la base
de datos indicada por `DB_DATABASE` (por defecto, `ecommerce_api`) y añade las
claves de prueba de Stripe:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecommerce_api
DB_USERNAME=root
DB_PASSWORD=
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
```

Genera las claves de Laravel y JWT, aplica las migraciones y carga el catálogo:

```bash
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
```

`migrate --seed` carga cuatro productos de demostración. Luego inicia la API:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

La documentación Swagger queda disponible en
[`http://127.0.0.1:8000/api/documentation`](http://127.0.0.1:8000/api/documentation).
No compartas ni subas `.env`, claves `sk_test_...` o tokens JWT. Usa únicamente
claves `pk_test_...` y `sk_test_...` para las pruebas locales.

## Configuración

En otra terminal, desde la carpeta `ecommerce-frontend`:

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env.local` y configura la URL de la API y la clave
   publicable de Stripe:

   ```dotenv
   API_BASE_URL=http://127.0.0.1:8000/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

   `API_BASE_URL` debe apuntar al prefijo API de Laravel. La clave publicable
   `pk_test_...` se puede exponer al navegador. Debe corresponder a la misma
   cuenta Stripe que la clave secreta `sk_test_...` configurada en Laravel.
   Nunca pongas una clave secreta `sk_...` en variables `NEXT_PUBLIC_*`.

3. Inicia Next.js en modo desarrollo:

   ```bash
   npm run dev
   ```

   Abre [`http://localhost:3000`](http://localhost:3000). Para probar como
   producción, ejecuta `npm run build` y luego `npm run start` (manteniendo la
   API activa en la otra terminal).

## Probar el flujo de compra

1. Confirma que la API responde abriendo el catálogo en
   [`http://127.0.0.1:8000/api/products`](http://127.0.0.1:8000/api/products);
   debe devolver los cuatro productos sembrados.
2. En el frontend, abre `/register` y crea una cuenta de prueba. También puedes
   iniciar sesión desde `/login` si ya registraste una.
3. En `/`, abre un producto y pulsa **Agregar al carrito**.
4. Abre **Carrito** y completa `/checkout`. El checkout y `/dashboard/ordenes`
   requieren iniciar sesión; sin sesión te redirigen a `/login`.
5. Para Stripe en modo de prueba, usa la tarjeta `4242 4242 4242 4242`, una
   fecha futura (por ejemplo `12/34`) y cualquier CVC de tres dígitos. No uses
   datos de tarjetas reales.
6. Al confirmarse el pago, el frontend muestra `/checkout/success` y limpia el
   carrito. Comprueba en `/dashboard/ordenes` que la orden figura como `paid`.

El backend calcula el total y descuenta el inventario al crear la orden. Si un
pago falla, el checkout conserva el carrito y permite reintentar el pago de la
orden existente; no vuelvas a agregar otra orden para el mismo intento.

### Problemas comunes

- **El catálogo está vacío:** ejecuta `php artisan migrate --seed` en el backend.
- **Error de conexión/API:** comprueba que Laravel está escuchando en el puerto
  8000 y que `API_BASE_URL` termina en `/api`.
- **Stripe no está disponible o rechaza el pago:** revisa que ambas claves sean
  de prueba y de la misma cuenta Stripe; reinicia Next.js después de modificar
  `.env.local`.
- **La orden no se puede crear por stock:** vuelve a cargar el catálogo; la API
  valida existencias al confirmar la compra.

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

Se adjuntan las siguientes evidencias:

- [Captura de endpoints en Swagger](./public/swagger-endpoints.png).
- [Captura de compra confirmada con Stripe en modo de prueba](./public/flujo-compra.png).
- [Captura del historial con la orden pagada](./public/historial-compra-verificada.png).
- [Reporte Lighthouse del catálogo](./lighthouse-catalogo.report.html):
  Performance 73, Accessibility 95, Best Practices 100 y SEO 100.
  FCP 1.9 s, LCP 1.9 s, CLS 0 y TBT 1450 ms.
- [Captura del catálogo](./public/catalogo.png).
- [Captura del historial de compras](./public/historial-compra.png).

La compra de evidencia se completó localmente con una tarjeta de prueba de
Stripe; el historial confirmó el estado `paid`. No se usaron datos ni tarjetas
reales.

El reporte se generó en perfil móvil con la aplicación Next.js 16 en modo
producción sobre `http://127.0.0.1:3000/`, usando Edge como navegador
headless y la API Laravel local conectada. Estas métricas corresponden al
catálogo con datos reales de prueba, no a `/login` ni `/checkout`.

Comprobaciones locales:

```bash
npm run lint
npx tsc --noEmit
npm run build
```
