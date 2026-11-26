"use client";

import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createOrderAndPayAction,
  payExistingOrderAction,
  type PaymentActionResult,
} from "@/actions/order.actions";
import { useCart } from "@/context/CartContext";

function CheckoutContent({ stripeEnabled }: { stripeEnabled: boolean }) {
  const {
    items,
    removeItem,
    clearCart,
    checkoutAttempt,
    setCheckoutAttempt,
  } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const existingOrderId =
    checkoutAttempt.status === "pending" ? checkoutAttempt.orderId : null;
  const uncertainSubmission =
    checkoutAttempt.status === "uncertain" ||
    checkoutAttempt.status === "submitting";
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || uncertainSubmission || items.length === 0) return;

    if (!stripe || !elements) {
      setMessage("El formulario de pago todavía no está listo.");
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      setMessage("No se encontró el campo de tarjeta de Stripe.");
      return;
    }

    const orderItems = items.map(({ productId, quantity }) => ({
      product_id: Number(productId),
      quantity,
    }));
    if (
      orderItems.some(
        ({ product_id }) => !Number.isSafeInteger(product_id) || product_id < 1,
      )
    ) {
      setMessage("Uno o más productos tienen un identificador inválido.");
      return;
    }

    inFlight.current = true;
    setIsSubmitting(true);
    setMessage(null);
    let actionStarted = false;

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });

      if (error || !paymentMethod?.id) {
        setMessage(error?.message ?? "Stripe no pudo crear el método de pago.");
        return;
      }

      setCheckoutAttempt(
        existingOrderId === null
          ? { status: "submitting" }
          : { status: "submitting", orderId: existingOrderId },
      );
      actionStarted = true;
      const result: PaymentActionResult =
        existingOrderId === null
          ? await createOrderAndPayAction(orderItems, paymentMethod.id)
          : await payExistingOrderAction(existingOrderId, paymentMethod.id);

      if (result.success) {
        clearCart();
        router.replace(
          `/checkout/success?orderId=${encodeURIComponent(String(result.orderId))}`,
        );
        return;
      }

      setMessage(result.error);
      if (result.orderId !== undefined) {
        setCheckoutAttempt({ status: "pending", orderId: result.orderId });
      } else if (actionStarted && existingOrderId === null) {
        setCheckoutAttempt({ status: "uncertain" });
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo confirmar el resultado del pago.",
      );
      if (actionStarted && existingOrderId === null) {
        setCheckoutAttempt({ status: "uncertain" });
      }
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }

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
              disabled={isSubmitting || checkoutAttempt.status !== "idle"}
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

      {!stripeEnabled ? (
        <p role="alert">
          Falta configurar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY para habilitar el
          pago.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span>Datos de tarjeta (procesados directamente por Stripe)</span>
            <span className="block rounded border p-3">
              <CardElement
                options={{
                  hidePostalCode: true,
                  style: {
                    base: {
                      color: "#18181b",
                      fontFamily: "Arial, sans-serif",
                      fontSize: "16px",
                      "::placeholder": { color: "#71717a" },
                    },
                    invalid: { color: "#b91c1c" },
                  },
                }}
              />
            </span>
          </label>

          {message && <p role="alert">{message}</p>}
          {existingOrderId !== null && !uncertainSubmission && (
            <p>
              La orden #{existingOrderId} ya existe. El siguiente intento solo
              volverá a procesar el pago de esa orden.
            </p>
          )}
          {uncertainSubmission && (
            <p role="alert">
              El envío anterior quedó sin confirmar. No vuelvas a enviar el
              pago; revisa tu historial de órdenes o contacta soporte.
            </p>
          )}

          <button
            className="rounded bg-zinc-900 px-4 py-2 text-white"
            disabled={
              isSubmitting ||
              uncertainSubmission ||
              !stripe ||
              !elements
            }
            type="submit"
          >
            {isSubmitting
              ? "Procesando pago..."
              : existingOrderId !== null
                ? `Reintentar pago de orden #${existingOrderId}`
                : "Pagar con Stripe"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function CheckoutForm({
  publishableKey,
}: {
  publishableKey: string | null;
}) {
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent stripeEnabled={Boolean(publishableKey)} />
    </Elements>
  );
}
