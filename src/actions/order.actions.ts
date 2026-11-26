"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { CheckoutSessionResponse, Order, OrderItemInput } from "@/types";

function readOrderItems(formData: FormData): OrderItemInput[] {
  const rawItems = formData.get("items");
  if (typeof rawItems !== "string") {
    throw new Error("No se recibieron productos para la orden.");
  }

  const value: unknown = JSON.parse(rawItems);
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("El carrito está vacío o no es válido.");
  }

  const items = value.map((item): OrderItemInput => {
    if (
      !item ||
      typeof item !== "object" ||
      !("productId" in item) ||
      typeof item.productId !== "string" ||
      !("quantity" in item) ||
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error("Hay un producto inválido en el carrito.");
    }
    return { productId: item.productId, quantity: item.quantity };
  });

  return items;
}

async function createOrder(items: OrderItemInput[]) {
  const order = await apiRequest<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  revalidatePath("/dashboard/ordenes");
  return order;
}

export async function submitOrder(formData: FormData) {
  await createOrder(readOrderItems(formData));
  redirect("/dashboard/ordenes");
}

export async function startStripeCheckout(formData: FormData) {
  const order = await createOrder(readOrderItems(formData));
  const session = await apiRequest<CheckoutSessionResponse>(
    `/orders/${encodeURIComponent(order.id)}/checkout`,
    { method: "POST" },
  );

  if (!session.url) {
    throw new Error("La API no devolvió la URL de pago.");
  }
  redirect(session.url);
}
