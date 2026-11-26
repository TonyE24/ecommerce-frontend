import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">¡Gracias por tu compra!</h1>
      <p>
        Tu pago se está procesando. Puedes revisar el estado de la orden en tu
        historial.
      </p>
      <Link className="underline" href="/dashboard/ordenes">
        Ver mis órdenes
      </Link>
    </section>
  );
}
