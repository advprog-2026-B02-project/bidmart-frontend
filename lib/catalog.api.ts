import type {
  CatalogPageResponse,
  CatalogQueryParams,
  Category,
  ListingDetail,
} from "@/types/catalog";
 
export async function fetchCatalog(
  params: CatalogQueryParams = {}
): Promise<CatalogPageResponse> {
  const qs = new URLSearchParams();
 
  if (params.q)        qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.minPrice !== undefined) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set("maxPrice", String(params.maxPrice));
  if (params.endsBefore) qs.set("endsBefore", params.endsBefore);
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.size !== undefined) qs.set("size", String(params.size));
  if (params.sort) qs.set("sort", params.sort);
 
  const url = `/api/catalog${qs.toString() ? `?${qs.toString()}` : ""}`;
 
  const res = await fetch(url, { cache: "no-store" });
 
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Gagal memuat katalog (HTTP ${res.status})`));
  }
 
  return res.json() as Promise<CatalogPageResponse>;
}

export async function fetchListingDetail(id: string): Promise<ListingDetail> {
  const res = await fetch(`/api/listings/${id}`, { cache: "no-store" });
 
  if (res.status === 404) {
    throw new Error("Listing tidak ditemukan.");
  }
 
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Gagal memuat detail listing (HTTP ${res.status})`));
  }
 
  return res.json() as Promise<ListingDetail>;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories", { cache: "no-store" });
 
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Gagal memuat kategori (HTTP ${res.status})`));
  }
 
  return res.json() as Promise<Category[]>;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const text = await res.text();
  if (!text) return fallback;

  try {
    const data = JSON.parse(text);
    return data?.message || data?.error || fallback;
  } catch {
    return text;
  }
}
