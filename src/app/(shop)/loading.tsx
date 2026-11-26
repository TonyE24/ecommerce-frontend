export default function CatalogLoading() {
  return (
    <div aria-label="Cargando catálogo" className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-zinc-200" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div className="h-48 rounded-lg bg-zinc-100" key={item} />
        ))}
      </div>
    </div>
  );
}
