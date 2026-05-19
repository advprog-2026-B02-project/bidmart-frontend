
import type {
  OrderListResponse,
  OrderDetail,
  ShipOrderRequest,
  DisputeOrderRequest,
  OrderRole,
} from "@/types/order";
 
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Terjadi kesalahan (${res.status})`;
    try {
      const err = await res.json();
      if (err?.message) message = err.message;
      else if (err?.error) message = err.error;
    } catch {
    }
    throw new Error(message);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function fetchOrders(
  role: OrderRole,
  page = 0,
  size = 20
): Promise<OrderListResponse> {
  const params = new URLSearchParams({
    role,
    page: String(page),
    size: String(size),
  });
  const res = await fetch(`/api/orders?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return handleResponse<OrderListResponse>(res);
}

export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return handleResponse<OrderDetail>(res);
}
 
// Ship Order (Seller) 
export async function shipOrder(
  orderId: string,
  body: ShipOrderRequest
): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}/ship`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<void>(res);
}
 
// Receive Order (Buyer) 
export async function receiveOrder(orderId: string): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}/receive`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<void>(res);
}
 
// Dispute Order (Buyer) 
export async function disputeOrder(
  orderId: string,
  body: DisputeOrderRequest
): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}/dispute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<void>(res);
}