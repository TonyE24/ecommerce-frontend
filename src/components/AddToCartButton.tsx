"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  function handleAdd() {
    if (!addItem(product)) {
      setUnavailable(true);
      window.setTimeout(() => setUnavailable(false), 2500);
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      className="rounded bg-zinc-900 px-4 py-2 text-white"
      onClick={handleAdd}
      disabled={product.stock !== undefined && product.stock <= 0}
      type="button"
    >
      {product.stock !== undefined && product.stock <= 0
        ? "Agotado"
        : unavailable
          ? "Termina o revisa tu pago pendiente"
          : added
          ? "Agregado"
          : "Agregar al carrito"}
    </button>
  );
}
