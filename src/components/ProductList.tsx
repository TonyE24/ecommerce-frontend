import Link from 'next/link';
import { apiFetch } from '@/lib/api';

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

export default async function ProductList() {
  const result = await apiFetch<ProductListResponse>('/products', {
    next: { revalidate: 60 },
  });

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error('El backend devolvió una respuesta inválida para productos.');
  }

  if (result.data.length === 0) {
    return <p>No hay productos disponibles por el momento.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {result.data.map((product) => (
        <article key={product.id} className="min-h-44 rounded-lg border p-5">
          <h2 className="mb-2 text-xl font-semibold">{product.name}</h2>

          {product.description && (
            <p className="mb-4 line-clamp-2 text-gray-600">
              {product.description}
            </p>
          )}

          <p className="mb-2">Precio: {Number(product.price).toFixed(2)}</p>
          <p className="mb-4 text-sm text-gray-600">
            {product.stock > 0 ? 'Disponible' : 'Agotado'}
          </p>

          <Link href={`/productos/${product.id}`} className="underline">
            Ver producto
          </Link>
        </article>
      ))}
    </div>
  );
}