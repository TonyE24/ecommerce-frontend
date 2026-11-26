"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      className="rounded bg-zinc-900 px-4 py-2 text-white"
      onClick={handleAdd}
      type="button"
    >
      {added ? "Agregado" : "Agregar al carrito"}
    </button>
  );
}
