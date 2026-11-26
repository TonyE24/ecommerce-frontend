"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

interface CartItemInput {
  product_id: number;
  quantity: number;
}

export type PaymentActionResult =
  | { success: true; orderId: number }
  | { success: false; error: string; orderId?: number };

interface OrderResponse {
  success: boolean;
  data: { id: number };
}

interface PaymentResponse {
  success: boolean;
  data: { status: string };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "No se pudo procesar la orden.";
}

function isValidItems(items: CartItemInput[]): boolean {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        Number.isSafeInteger(item.product_id) &&
        item.product_id > 0 &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0,
    )
  );
}

function isValidPaymentMethodId(paymentMethodId: string): boolean {
  return /^pm_[A-Za-z0-9]+$/.test(paymentMethodId);
}

async function processExistingOrderPayment(
  orderId: number,
  paymentMethodId: string,
  token: string,
): Promise<PaymentActionResult> {
  try {
    const paymentResponse = await apiFetch<PaymentResponse>(
      "/payments/process",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_method_id: paymentMethodId,
        }),
      },
    );

    if (
      !paymentResponse.success ||
      paymentResponse.data?.status !== "succeeded"
    ) {
      return {
        success: false,
        error: "El pago no fue confirmado. La orden existente se conserva.",
        orderId,
      };
    }

    revalidatePath("/dashboard/ordenes");
    return { success: true, orderId };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
      orderId,
    };
  }
}

export async function createOrderAndPayAction(
  items: CartItemInput[],
  paymentMethodId: string,
): Promise<PaymentActionResult> {
  if (!isValidItems(items)) {
    return { success: false, error: "El carrito no contiene artículos válidos." };
  }

  if (!isValidPaymentMethodId(paymentMethodId)) {
    return { success: false, error: "El método de pago de Stripe no es válido." };
  }

  const token = (await cookies()).get("jwt_token")?.value;
  if (!token) {
    return { success: false, error: "Inicia sesión antes de pagar." };
  }

  let orderId: number | undefined;

  try {
    const orderResponse = await apiFetch<OrderResponse>("/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    if (!orderResponse.success || !Number.isSafeInteger(orderResponse.data?.id)) {
      throw new Error("El backend no devolvió una orden válida.");
    }

    orderId = orderResponse.data.id;
    revalidatePath("/dashboard/ordenes");
    revalidatePath("/");

    return await processExistingOrderPayment(orderId, paymentMethodId, token);
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
      ...(orderId !== undefined ? { orderId } : {}),
    };
  }
}

export async function payExistingOrderAction(
  orderId: number,
  paymentMethodId: string,
): Promise<PaymentActionResult> {
  if (!Number.isSafeInteger(orderId) || orderId < 1) {
    return { success: false, error: "La orden indicada no es válida." };
  }

  if (!isValidPaymentMethodId(paymentMethodId)) {
    return { success: false, error: "El método de pago de Stripe no es válido." };
  }

  const token = (await cookies()).get("jwt_token")?.value;
  if (!token) {
    return { success: false, error: "Inicia sesión antes de pagar.", orderId };
  }

  return processExistingOrderPayment(orderId, paymentMethodId, token);
}
