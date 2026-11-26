import { Suspense } from "react";
import { apiRequest } from "@/lib/api";
import type { Order } from "@/types";

async function OrderHistory() {
  const orders = await apiRequest<Order[]>("/orders");

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
            }).format(order.total)}
          </p>
          <time dateTime={order.createdAt}>
            {new Date(order.createdAt).toLocaleDateString("es-SV")}
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
