import type { ListingDetail } from "@/types/catalog";

 
export interface ListingImageRequest {
  url: string;
  thumbnailUrl?: string | null;
  displayOrder: number;
}
 
export interface CreateListingPayload {
  categoryId: string;
  title: string;
  description?: string | null;
  startingPrice: number;
  reservePrice?: number | null;
  minimumIncrement: number;
  auctionDuration: number;
  images?: ListingImageRequest[];
}
 
export interface EditListingPayload {
  categoryId?: string;
  title?: string;
  description?: string | null;
  startingPrice?: number;
  reservePrice?: number | null;
  minimumIncrement?: number;
  auctionDuration?: number;
  images?: ListingImageRequest[];
}
 
// ─── API Functions ───────────────────────────────────────────
 
/**
 * Ambil semua listing milik seller yang sedang login.
 * BFF: GET /api/seller/listings → Backend: GET /seller/listings
 */
export async function fetchSellerListings(): Promise<ListingDetail[]> {
  const res = await fetch("/api/seller/listings", { cache: "no-store" });
 
  if (!res.ok) {
    throw new Error(`Gagal memuat listing kamu (HTTP ${res.status})`);
  }
 
  return res.json() as Promise<ListingDetail[]>;
}
 
/**
 * Buat listing baru (otomatis status DRAFT).
 * BFF: POST /api/seller/listings → Backend: POST /seller/listings/new
 */
export async function createListing(
  payload: CreateListingPayload
): Promise<ListingDetail> {
  const res = await fetch("/api/seller/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
 
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal membuat listing (HTTP ${res.status})`
    );
  }
 
  return res.json() as Promise<ListingDetail>;
}
 
/**
 * Edit listing yang ada.
 * BFF: PUT /api/seller/listings/[id] → Backend: PUT /seller/listings/{id}/edit
 */
export async function editListing(
  id: string,
  payload: EditListingPayload
): Promise<ListingDetail> {
  const res = await fetch(`/api/seller/listings/${id}/edit`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
 
  if (res.status === 409) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        "Listing tidak bisa diedit karena sudah ada bid atau sudah ditutup."
    );
  }
 
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal mengedit listing (HTTP ${res.status})`
    );
  }
 
  return res.json() as Promise<ListingDetail>;
}
 
/**
 * Aktivasi listing dari DRAFT ke ACTIVE.
 * BFF: PATCH /api/seller/listings/[id]/activate → Backend: PATCH /seller/listings/{id}/activate
 */
export async function activateListing(id: string): Promise<ListingDetail> {
  const res = await fetch(`/api/seller/listings/${id}/activate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
 
  if (res.status === 409) {
    throw new Error("Listing tidak bisa diaktifkan. Pastikan status masih DRAFT.");
  }
 
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal mengaktifkan listing (HTTP ${res.status})`
    );
  }
 
  return res.json() as Promise<ListingDetail>;
}
 
/**
 * Batalkan listing menjadi CLOSED.
 * BFF: PATCH /api/seller/listings/[id]/cancel → Backend: PATCH /seller/listings/{id}/cancel
 * Backend returns 204 No Content — tidak ada response body.
 */
export async function cancelListing(id: string): Promise<void> {
  const res = await fetch(`/api/seller/listings/${id}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
 
  if (res.status === 409) {
    throw new Error("Listing tidak bisa dibatalkan karena sudah ada bid aktif.");
  }
 
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal membatalkan listing (HTTP ${res.status})`
    );
  }
}
 
/**
 * Hapus listing secara permanen (hanya DRAFT).
 * BFF: DELETE /api/seller/listings/[id] → Backend: DELETE /seller/listings/{id}
 * Backend returns 204 No Content — tidak ada response body.
 */
export async function deleteListing(id: string): Promise<void> {
  const res = await fetch(`/api/seller/listings/${id}`, {
    method: "DELETE",
  });
 
  if (res.status === 409) {
    throw new Error("Hanya listing berstatus DRAFT yang bisa dihapus.");
  }
 
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `Gagal menghapus listing (HTTP ${res.status})`
    );
  }
}