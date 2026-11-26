'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

interface CartItemInput {
  product_id: number;
  quantity: number;
}

type ActionResult =
  | { success: true; orderId: number }
  | { success: false; error: string; orderId?: number };

type OrderResponse = {
  success: boolean;
  data: {
    id: number;
  };
};

type PaymentResponse = {
  success: boolean;
  data: {
    status: string;
  };
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'No se pudo procesar la orden.';
}

export async function createOrderAndPayAction(
  items: CartItemInput[],
  paymentMethodId: string,
): Promise<ActionResult> {
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some(
      (item) =>
        !item ||
        !Number.isInteger(item.product_id) ||
        item.product_id < 1 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1,
    )
  ) {
    return { success: false, error: 'El carrito no contiene artículos válidos.' };
  }

  if (typeof paymentMethodId !== 'string' || paymentMethodId.trim() === '') {
    return { success: false, error: 'Falta el método de pago de Stripe.' };
  }

  const token = (await cookies()).get('jwt_token')?.value;

  if (!token) {
    return { success: false, error: 'Inicia sesión antes de pagar.' };
  }

  let orderId: number | undefined;

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const orderResponse = await apiFetch<OrderResponse>('/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ items }),
    });

    if (!orderResponse.success || !Number.isInteger(orderResponse.data?.id)) {
      throw new Error('El backend no devolvió una orden válida.');
    }

    orderId = orderResponse.data.id;

    // La orden ya existe y el backend ya descontó el inventario.
    revalidatePath('/dashboard/ordenes');
    revalidatePath('/');

    const paymentResponse = await apiFetch<PaymentResponse>(
      '/payments/process',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: orderId,
          payment_method_id: paymentMethodId,
        }),
      },
    );

    if (
      !paymentResponse.success ||
      paymentResponse.data?.status !== 'succeeded'
    ) {
      return {
        success: false,
        error: 'La orden se creó, pero el pago no fue confirmado.',
        orderId,
      };
    }

    revalidatePath('/dashboard/ordenes');

    return { success: true, orderId };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
      ...(orderId !== undefined ? { orderId } : {}),
    };
  }
}