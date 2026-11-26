'use client';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      role="alert"
      className="rounded-lg border bg-red-50 p-8 text-center"
    >
      <h2 className="text-xl font-semibold text-red-700">
        No se pudo cargar la tienda
      </h2>

      <p className="mt-2 text-sm text-red-600">
        Ocurrió un problema al cargar el contenido. Intenta de nuevo.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      )}

      {error.digest && (
        <p className="mt-2 text-xs text-gray-600">
          Referencia del error: {error.digest}
        </p>
      )}

      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Reintentar
      </button>
    </main>
  );
}