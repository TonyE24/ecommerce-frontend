"use client";

import Link from "next/link";
import { useCart, useIsHydrated } from "@/context/CartContext";
import { logoutAction } from "@/actions/auth.actions";

export default function Navbar({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const { itemCount } = useCart();
  const isHydrated = useIsHydrated();
  const visibleItemCount = isHydrated ? itemCount : 0;

  return (
    <header className="border-b border-zinc-200">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link className="font-bold" href="/">
          Tienda
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/">Productos</Link>
          <Link href="/dashboard/ordenes">Mis órdenes</Link>
          <Link
            href="/checkout"
            aria-label={`Carrito: ${visibleItemCount} productos`}
          >
            Carrito ({visibleItemCount})
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard/ordenes">Mi cuenta</Link>
              <form action={logoutAction}>
                <button className="underline" type="submit">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Ingresar</Link>
              <Link href="/register">Crear cuenta</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
