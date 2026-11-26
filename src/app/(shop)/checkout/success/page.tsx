import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">¡Pago confirmado!</h1>
      {orderId && <p>Tu número de orden es #{orderId}.</p>}
      <p>Stripe confirmó el pago. Puedes revisar la orden en tu historial.</p>
      <Link className="underline" href="/dashboard/ordenes">
        Ver mis órdenes
      </Link>
    </section>
  );
}
