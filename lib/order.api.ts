import type { OrderListParams, OrderListResponse, OrderDetail, ShipOrderPayload, DisputePayload } from "@/types/order";


export async function fetchOrders(
  params: OrderListParams
): Promise<OrderListResponse> {
  const qs = new URLSearchParams();

  qs.set("role", params.role);
  if (params.status) qs.set("status", params.status);
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.size !== undefined) qs.set("size", String(params.size));

  const res = await fetch(`/api/orders?${qs.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal memuat daftar pesanan (HTTP ${res.status})`
    );
  }

  return res.json() as Promise<OrderListResponse>;
}

export async function fetchOrderDetail(id: string): Promise<OrderDetail> {
  const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });

  if (res.status === 403) {
    throw new Error("Kamu tidak punya akses ke pesanan ini.");
  }
  if (res.status === 404) {
    throw new Error("Pesanan tidak ditemukan.");
  }
  if (!res.ok) {
    throw new Error(`Gagal memuat detail pesanan (HTTP ${res.status})`);
  }

  return res.json() as Promise<OrderDetail>;
}

export async function shipOrder(
  id: string,
  payload: ShipOrderPayload
): Promise<void> {
  const res = await fetch(`/api/orders/${id}/ship`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 400) {
    throw new Error("Status pesanan belum sesuai atau data pengiriman tidak valid.");
  }
  if (res.status === 403) {
    throw new Error("Kamu bukan penjual pesanan ini.");
  }
  if (!res.ok && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal mengupdate pengiriman (HTTP ${res.status})`
    );
  }
}

export async function packageOrder(id: string): Promise<void> {
  await shipOrder(id, { status: "PACKAGED" });
}

export async function receiveOrder(id: string): Promise<void> {
  const res = await fetch(`/api/orders/${id}/receive`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });

  if (res.status === 400) {
    throw new Error("Pesanan belum berstatus SHIPPED.");
  }
  if (res.status === 403) {
    throw new Error("Kamu bukan pembeli pesanan ini.");
  }
  if (!res.ok && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal mengkonfirmasi penerimaan (HTTP ${res.status})`
    );
  }
}

export async function createDispute(
  id: string,
  payload: DisputePayload
): Promise<void> {
  const res = await fetch(`/api/orders/${id}/dispute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 400) {
    throw new Error("Pesanan belum berstatus SHIPPED atau data tidak valid.");
  }
  if (res.status === 403) {
    throw new Error("Kamu bukan pembeli pesanan ini.");
  }
  if (!res.ok && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal mengajukan komplain (HTTP ${res.status})`
    );
  }
}
