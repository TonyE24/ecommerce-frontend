"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { itemCount } = useCart();

  return (
    <header className="border-b border-zinc-200">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link className="font-bold" href="/">
          Tienda
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/">Productos</Link>
          <Link href="/dashboard/ordenes">Mis órdenes</Link>
          <Link href="/checkout" aria-label={`Carrito: ${itemCount} productos`}>
            Carrito ({itemCount})
          </Link>
          <Link href="/login">Ingresar</Link>
        </div>
      </nav>
    </header>
  );
}
