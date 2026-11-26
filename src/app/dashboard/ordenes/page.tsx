import { Suspense } from "react";
import { apiFetch } from "@/lib/api";

interface OrdersResponse {
  success: boolean;
  data: Array<{
    id: number | string;
    status: string;
    total: number | string;
    created_at: string;
  }>;
}

async function OrderHistory() {
  const response = await apiFetch<OrdersResponse>("/orders");
  if (!response.success || !Array.isArray(response.data)) {
    throw new Error("El backend devolvió una respuesta inválida para las órdenes.");
  }
  const orders = response.data;

  if (orders.length === 0) {
    return <p>Aún no tienes órdenes.</p>;
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li className="rounded border p-4" key={order.id}>
          <p className="font-semibold">Orden #{order.id}</p>
          <p>Estado: {order.status}</p>
          <p>
            Total:{" "}
            {new Intl.NumberFormat("es-SV", {
              style: "currency",
              currency: "USD",
            }).format(Number(order.total))}
          </p>
          <time dateTime={order.created_at}>
            {new Date(order.created_at).toLocaleDateString("es-SV")}
          </time>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <section>
      <h1 className="mb-6 text-3xl font-bold">Mis órdenes</h1>
      <Suspense fallback={<p>Cargando órdenes...</p>}>
        <OrderHistory />
      </Suspense>
    </section>
  );
}
