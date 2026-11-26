import { notFound } from "next/navigation";
import { Suspense } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { ApiError, apiRequest } from "@/lib/api";
import type { Product } from "@/types";

async function ProductDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product: Product;
  try {
    product = await apiRequest<Product>(`/products/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <article className="space-y-4">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-zinc-600">{product.description}</p>
      <p className="text-xl font-semibold">
        {new Intl.NumberFormat("es-SV", {
          style: "currency",
          currency: "USD",
        }).format(product.price)}
      </p>
      <AddToCartButton product={product} />
    </article>
  );
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p>Cargando producto...</p>}>
      <ProductDetails params={params} />
    </Suspense>
  );
}
