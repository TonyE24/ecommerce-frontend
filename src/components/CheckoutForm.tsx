"use client";

import { startStripeCheckout, submitOrder } from "@/actions/order.actions";
import { useCart } from "@/context/CartContext";

export default function CheckoutForm() {
  const { items, removeItem } = useCart();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serializedItems = JSON.stringify(
    items.map(({ productId, quantity }) => ({ productId, quantity })),
  );

  if (items.length === 0) {
    return <p>Tu carrito está vacío.</p>;
  }

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-zinc-200">
        {items.map((item) => (
          <li
            className="flex items-center justify-between gap-4 py-3"
            key={item.productId}
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <button
              className="text-sm underline"
              onClick={() => removeItem(item.productId)}
              type="button"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <p className="text-lg font-semibold">
        Total estimado:{" "}
        {new Intl.NumberFormat("es-SV", {
          style: "currency",
          currency: "USD",
        }).format(total)}
      </p>
      <form action={startStripeCheckout}>
        <input name="items" type="hidden" value={serializedItems} />
        <button className="rounded bg-zinc-900 px-4 py-2 text-white" type="submit">
          Pagar con Stripe
        </button>
      </form>
      <form action={submitOrder}>
        <input name="items" type="hidden" value={serializedItems} />
        <button className="rounded border px-4 py-2" type="submit">
          Crear orden sin pago
        </button>
      </form>
    </div>
  );
}
