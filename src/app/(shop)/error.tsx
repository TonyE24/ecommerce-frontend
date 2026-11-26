"use client";

import { useEffect } from "react";

export default function CatalogError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Error al cargar el catálogo.", error);
  }, [error]);

  return (
    <section role="alert">
      <h1 className="text-2xl font-bold">No se pudo cargar el catálogo</h1>
      <p className="my-3">Intenta de nuevo en unos momentos.</p>
      <button className="rounded border px-4 py-2" onClick={() => retry()}>
        Reintentar
      </button>
    </section>
  );
}
