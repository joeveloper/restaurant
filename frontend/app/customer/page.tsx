"use client";

import { useCallback, useEffect, useState } from "react";
import { api, CUSTOMER, FLOW, MenuItem, Order, RESTAURANT } from "@/lib/api";

const LATEST_KEY = "latestOrderId";

export default function CustomerPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<MenuItem[]>("/menu", undefined, "Could not load menu.").then(setMenu).catch((e) => setError(e.message));
  }, []);

  // Poll the backend; the order shown is always what the backend last returned.
  const refresh = useCallback(async () => {
    try {
      const orders = await api<Order[]>("/orders");
      const mine = orders.filter((o) => o.customerId === CUSTOMER.id);
      const savedId = localStorage.getItem(LATEST_KEY);
      setOrder(mine.find((o) => o.id === savedId) ?? mine[mine.length - 1] ?? null);
    } catch {
      /* keep showing last confirmed state */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [refresh]);

  async function placeOrder() {
    const items = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (items.length === 0) return setError("Select at least one item.");
    setError("");
    try {
      const created = await api<Order>(
        "/orders",
        { method: "POST", body: JSON.stringify({ customerId: CUSTOMER.id, restaurantId: RESTAURANT.id, items }) },
        "Order could not be created.",
      );
      localStorage.setItem(LATEST_KEY, created.id);
      setOrder(created);
      setQty({});
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const rejected = order?.status === "REJECTED";
  const currentIdx = order ? FLOW.findIndex((s) => s.status === order.status) : -1;

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">{RESTAURANT.name}</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Menu</h2>
        {menu.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded border p-3">
            <span>{item.name} — ${item.price.toFixed(2)}</span>
            <input
              type="number" min={0} aria-label={`Quantity of ${item.name}`}
              className="w-16 rounded border p-1"
              value={qty[item.id] ?? 0}
              onChange={(e) => setQty({ ...qty, [item.id]: Math.max(0, parseInt(e.target.value) || 0) })}
            />
          </div>
        ))}
        <button onClick={placeOrder} className="rounded bg-blue-600 px-4 py-2 text-white">Place Order</button>
        {error && <p className="text-red-600">{error}</p>}
      </section>

      {order && (
        <section className="space-y-3 rounded border p-4">
          <h2 className="font-semibold">Current order {order.id}</h2>
          <ul className="text-sm">
            {order.items.map((i) => <li key={i.menuItemId}>{i.quantity} × {i.name}</li>)}
          </ul>
          <p>Total: ${order.total.toFixed(2)}</p>
          <p>Payment: <b>{order.paymentStatus}</b></p>
          <p>Status: <b>{order.status}</b></p>

          {rejected ? (
            <div className="rounded bg-red-100 p-3 text-red-800">
              <p className="font-bold">Order rejected by restaurant</p>
              {order.paymentStatus === "REFUNDED" && <p>Payment refunded</p>}
            </div>
          ) : (
            <ul className="space-y-1">
              {FLOW.map((s, i) => (
                <li key={s.status}>
                  {i < currentIdx || order.status === "DELIVERED" ? "✓" : i === currentIdx ? "●" : "○"} {s.label}
                </li>
              ))}
            </ul>
          )}

          <div>
            <h3 className="font-semibold">History</h3>
            <ul className="text-sm text-gray-600">
              {order.statusHistory.map((h, i) => (
                <li key={i}>{h.status} — {new Date(h.timestamp).toLocaleTimeString()}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
