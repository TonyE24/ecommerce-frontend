"use client";

import { useEffect } from "react";

export default function OrdersError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Error al cargar el historial de órdenes.", error);
  }, [error]);

  return (
    <section role="alert">
      <h1 className="text-2xl font-bold">No se pudieron cargar tus órdenes</h1>
      <button className="mt-4 rounded border px-4 py-2" onClick={() => retry()}>
        Reintentar
      </button>
    </section>
  );
}
