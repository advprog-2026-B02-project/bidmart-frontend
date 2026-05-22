"use client";

import { useState, useEffect, useCallback } from "react";
import {useAuth} from "@/context/AuthContext";
import {moderateAdminListing} from "@/lib/admin-operations.api";
import { fetchCatalog, fetchCategories } from "@/lib/catalog.api";
import {canAccessAdminArea} from "@/lib/navigation";
import type { CatalogItem, Category, CatalogQueryParams } from "@/types/catalog";
import CatalogCard from "@/components/catalog/CatalogCard";
import CatalogCardSkeleton from "@/components/catalog/CatalogCardSkeleton";
import { toEpochMillis } from "@/lib/utils/dateTime";

function isAuctionOngoing(item: CatalogItem): boolean {
  if (item.status !== "ACTIVE" || !item.auctionEndTime) return false;
  const endTime = toEpochMillis(item.auctionEndTime);
  return endTime !== null && endTime > Date.now();
}

function FilterBar({
  query,
  onQueryChange,
  categories,
  selectedCategory,
  onCategoryChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  onSubmit,
  onReset,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  minPrice: string;
  onMinPriceChange: (v: string) => void;
  maxPrice: string;
  onMaxPriceChange: (v: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-[#002447]">🔍 Cari & Filter</h2>
 
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pencarian keyword */}
        <input
          type="text"
          placeholder="Cari barang..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
        />
 
        {/* Filter kategori */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
 
        {/* Filter harga minimum */}
        <input
          type="number"
          placeholder="Harga minimum (Rp)"
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
          min={0}
          className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
        />
 
        {/* Filter harga maksimum */}
        <input
          type="number"
          placeholder="Harga maksimum (Rp)"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
          min={0}
          className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
        />
      </div>
 
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onSubmit}
          className="rounded-lg bg-[#002447] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b70]"
        >
          Terapkan Filter
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
 
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
 
  const pages = Array.from({ length: totalPages }, (_, i) => i);
  // Tampilkan max 5 page di sekitar current
  const start = Math.max(0, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);
  const visible = pages.slice(start, end + 1);
 
  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
      >
        ‹ Sebelumnya
      </button>
 
      {start > 0 && (
        <>
          <button
            onClick={() => onPageChange(0)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            1
          </button>
          {start > 1 && <span className="px-1 text-gray-400">···</span>}
        </>
      )}
 
      {visible.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            p === currentPage
              ? "bg-[#002447] text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {p + 1}
        </button>
      ))}
 
      {end < totalPages - 1 && (
        <>
          {end < totalPages - 2 && <span className="px-1 text-gray-400">···</span>}
          <button
            onClick={() => onPageChange(totalPages - 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}
 
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
      >
        Berikutnya ›
      </button>
    </div>
  );
}

export default function CatalogPage() {
  const {user} = useAuth();
  const isAdmin = canAccessAdminArea(user?.roles ?? []);

  // Filter state
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
 
  // Active (applied) filter params — trigger fetch ulang
  const [appliedParams, setAppliedParams] = useState<CatalogQueryParams>({
    page: 0,
    size: 20,
  });
 
  // Data state
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
 
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
 
  useEffect(() => {
    let isMounted = true;
 
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        if (isMounted) setCategories(data);
      } catch {
        if (isMounted) setCategories([]);
      }
    }
 
    loadCategories();
 
    return () => {
      isMounted = false;
    };
  }, []);
 
  useEffect(() => {
    let isMounted = true;
 
    async function loadCatalog() {
      setLoading(true);
      setError(null);
 
      try {
        const data = await fetchCatalog(appliedParams);
 
        if (isMounted) {
          setItems((data.content ?? []).filter(isAuctionOngoing));
          setTotalPages(data.totalPages ?? 0);
          setCurrentPage(data.number ?? 0);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat memuat katalog."
          );
          setItems([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
 
    loadCatalog();
 
    return () => {
      isMounted = false;
    };
  }, [appliedParams]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setItems((current) => current.filter(isAuctionOngoing));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleApplyFilter = useCallback(() => {
    const params: CatalogQueryParams = { page: 0, size: 20 };
    if (query.trim()) params.q = query.trim();
    if (selectedCategory) params.category = selectedCategory;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    setAppliedParams(params);
  }, [query, selectedCategory, minPrice, maxPrice]);
 
  const handleReset = useCallback(() => {
    setQuery("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setAppliedParams({ page: 0, size: 20 });
  }, []);
 
  const handlePageChange = useCallback(
    (page: number) => {
      setAppliedParams((prev) => ({ ...prev, page }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  const handleAdminDelete = useCallback(async (id: string) => {
    if (!window.confirm("Hapus listing ini dari katalog?")) return;

    setDeletingId(id);
    setDeleteError(null);

    try {
      await moderateAdminListing(id, "DELETE", "Deleted by admin from catalog page");
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus listing dari katalog.");
    } finally {
      setDeletingId(null);
    }
  }, []);
 
  return (
    <main className="min-h-screen bg-[#f6f4ef]">
      {/* Header */}
      <div className="bg-[#002447] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight">Katalog Lelang</h1>
          <p className="mt-1 text-sm text-white/70">
            Temukan barang incaran kamu dan mulai bidding sekarang
          </p>
        </div>
      </div>
 
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Bar */}
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          onSubmit={handleApplyFilter}
          onReset={handleReset}
        />
 
        <div className="mt-8">
          {deleteError && (
            <div className="mb-5 rounded-2xl bg-red-50 px-6 py-4 text-sm font-semibold text-red-600">
              {deleteError}
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="rounded-2xl bg-red-50 px-6 py-5 text-sm text-red-600">
              <p className="font-semibold">Gagal memuat katalog</p>
              <p className="mt-1 text-red-500">{error}</p>
              <button
                onClick={handleApplyFilter}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              >
                Coba Lagi
              </button>
            </div>
          )}
 
          {/* Loading state: skeleton grid */}
          {loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CatalogCardSkeleton key={i} />
              ))}
            </div>
          )}
 
          {/* Empty state */}
          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="mb-4 text-6xl">🏷️</span>
              <h3 className="text-lg font-semibold text-gray-700">
                Tidak ada listing yang ditemukan
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Coba ubah filter atau kata kunci pencarian kamu.
              </p>
              <button
                onClick={handleReset}
                className="mt-5 rounded-lg bg-[#002447] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003b70]"
              >
                Reset Filter
              </button>
            </div>
          )}
 
          {/* Catalog grid */}
          {!loading && !error && items.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    canDelete={isAdmin}
                    deleting={deletingId === item.id}
                    onDelete={handleAdminDelete}
                  />
                ))}
              </div>
 
              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
