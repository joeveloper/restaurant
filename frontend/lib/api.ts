export const API_URL = "http://localhost:3001";

export const CUSTOMER = { id: "customer-1", name: "Demo Customer" };
export const RESTAURANT = { id: "restaurant-1", name: "Demo Restaurant" };

export type OrderStatus =
  | "PLACED" | "ACCEPTED" | "PREPARING" | "READY" | "PICKED_UP" | "DELIVERED" | "REJECTED";

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  items: { menuItemId: string; name: string; price: number; quantity: number }[];
  total: number;
  paymentStatus: "AUTHORIZED" | "REFUNDED";
  status: OrderStatus;
  statusHistory: { status: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem { id: string; name: string; price: number }

export const FLOW: { status: OrderStatus; label: string }[] = [
  { status: "PLACED", label: "Placed" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready" },
  { status: "PICKED_UP", label: "Picked up" },
  { status: "DELIVERED", label: "Delivered" },
];

/** Calls the backend; throws Error(message) with the backend's message when available. */
export async function api<T>(path: string, init?: RequestInit, fallback = "Request failed"): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new Error(fallback);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(msg || fallback);
  }
  return res.json();
}
