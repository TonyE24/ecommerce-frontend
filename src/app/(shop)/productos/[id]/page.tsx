import { Suspense } from "react";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { ApiError, apiFetch } from "@/lib/api";
import type { Product } from "@/types";

interface ProductResponse {
  success: boolean;
  data: {
    id: number | string;
    name: string;
    description: string | null;
    price: number | string;
    stock: number;
  };
}

async function ProductDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let response: ProductResponse;
  try {
    response = await apiFetch<ProductResponse>(
      `/products/${encodeURIComponent(id)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (!response.success || !response.data) {
    throw new Error("El backend devolvió una respuesta inválida para el producto.");
  }
  const product: Product = {
    id: String(response.data.id),
    name: response.data.name,
    description: response.data.description ?? "",
    price: Number(response.data.price),
    stock: response.data.stock,
  };
  if (!Number.isFinite(product.price)) {
    throw new Error("El backend devolvió un precio inválido para el producto.");
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
      {product.stock !== undefined && product.stock <= 0 && (
        <p>Producto agotado.</p>
      )}
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
