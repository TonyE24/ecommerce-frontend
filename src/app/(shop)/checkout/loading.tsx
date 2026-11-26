export default function CheckoutLoading() {
  return (
    <div aria-label="Cargando checkout" className="animate-pulse space-y-4">
      <div className="h-8 w-56 rounded bg-zinc-200" />
      <div className="h-36 rounded-lg bg-zinc-100" />
      <div className="h-10 w-40 rounded bg-zinc-200" />
    </div>
  );
}
