export default function ProductGridSkeleton() {
  return (
    <div
      aria-label="Cargando productos"
      aria-live="polite"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="min-h-44 animate-pulse rounded-lg border p-5"
        >
          <div className="mb-4 h-6 w-3/4 rounded bg-gray-200" />
          <div className="mb-2 h-4 w-full rounded bg-gray-200" />
          <div className="mb-6 h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-5 w-1/3 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}