import { Suspense } from 'react';
import ProductList from '@/components/ProductList';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

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