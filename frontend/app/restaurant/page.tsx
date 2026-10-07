"use client";

import { useCallback, useEffect, useState } from "react";
import { api, Order, OrderStatus, RESTAURANT } from "@/lib/api";

const NEXT_ACTION: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  ACCEPTED: { status: "PREPARING", label: "Start Preparing" },
  PREPARING: { status: "READY", label: "Mark Ready" },
  READY: { status: "PICKED_UP", label: "Mark Picked Up" },
  PICKED_UP: { status: "DELIVERED", label: "Mark Delivered" },
};

export default function RestaurantPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setOrders(await api<Order[]>("/orders"));
    } catch {
      /* keep showing last confirmed state */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [refresh]);

  // The UI only changes after the backend confirms; on failure the old state stays.
  async function act(id: string, path: string, body?: object) {
    setError("");
    try {
      const updated = await api<Order>(
        `/orders/${id}/${path}`,
        { method: "PATCH", body: body ? JSON.stringify(body) : undefined },
        "Status update failed.",
      );
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (e) {
      setError(`Status update failed: ${(e as Error).message}`);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">{RESTAURANT.name} — Orders</h1>
      {error && <p className="rounded bg-red-100 p-2 text-red-700">{error}</p>}
      {orders.length === 0 && <p className="text-gray-500">No orders yet.</p>}
      {[...orders].reverse().map((o) => {
        const next = NEXT_ACTION[o.status];
        return (
          <div key={o.id} className="space-y-2 rounded border p-4">
            <div className="flex justify-between">
              <b>{o.id}</b>
              <span>{o.status} / {o.paymentStatus}</span>
            </div>
            <ul className="text-sm">
              {o.items.map((i) => <li key={i.menuItemId}>{i.quantity} × {i.name}</li>)}
            </ul>
            <p className="text-sm">Total: ${o.total.toFixed(2)}</p>
            <div className="flex gap-2">
              {o.status === "PLACED" && (
                <>
                  <button onClick={() => act(o.id, "accept")} className="rounded bg-green-600 px-3 py-1 text-white">Accept</button>
                  <button onClick={() => act(o.id, "reject")} className="rounded bg-red-600 px-3 py-1 text-white">Reject</button>
                </>
              )}
              {next && (
                <button onClick={() => act(o.id, "status", { status: next.status })} className="rounded bg-blue-600 px-3 py-1 text-white">
                  {next.label}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </main>
  );
}
