import { Suspense } from 'react';
import Link from 'next/link';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  stock: number;
};

type ProductListResponse = {
  success: boolean;
  data: Product[];
};

function ProductGridSkeleton() {
  return (
    <div
      aria-label="Cargando productos"
      aria-live="polite"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="min-h-44 animate-pulse rounded-lg border p-5"
        >
          <div className="mb-4 h-6 w-3/4 rounded bg-gray-200" />
          <div className="mb-2 h-4 w-full rounded bg-gray-200" />
          <div className="mb-6 h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-5 w-1/3 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

async function ProductList() {
  const apiUrl = process.env.API_URL?.replace(/\/+$/, '');

  if (!apiUrl) {
    throw new Error('Falta configurar API_URL en el entorno del frontend.');
  }

  const response = await fetch(`${apiUrl}/products`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
  }

  const result: ProductListResponse = await response.json();

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error('El backend devolvió una respuesta inválida para productos.');
  }

  if (result.data.length === 0) {
    return <p>No hay productos disponibles por el momento.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {result.data.map((product) => (
        <article
          key={product.id}
          className="min-h-44 rounded-lg border p-5"
        >
          <h2 className="mb-2 text-xl font-semibold">{product.name}</h2>

          {product.description && (
            <p className="mb-4 line-clamp-2 text-gray-600">
              {product.description}
            </p>
          )}

          <p className="mb-2">
            Precio: {Number(product.price).toFixed(2)}
          </p>

          <p className="mb-4 text-sm text-gray-600">
            {product.stock > 0 ? 'Disponible' : 'Agotado'}
          </p>

          <Link
            href={`/productos/${product.id}`}
            className="font-medium underline"
          >
            Ver producto
          </Link>
        </article>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Catálogo de productos</h1>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductList />
      </Suspense>
    </main>
  );
}