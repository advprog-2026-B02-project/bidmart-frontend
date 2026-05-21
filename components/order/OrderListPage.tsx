"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchOrders } from "@/lib/order.api";
import type { OrderSummary, OrderRole, OrderStatus } from "@/types/order";
import OrderCard from "@/components/order/OrderCard";

interface Props {
  role: OrderRole;
  pageTitle: string;
  pageSubtitle: string;
}

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "",          label: "Semua Status" },
  { value: "CREATED",   label: "📋 Dibuat" },
  { value: "PACKAGED",  label: "📦 Dikemas" },
  { value: "SHIPPED",   label: "🚚 Dikirim" },
  { value: "COMPLETED", label: "✅ Selesai" },
  { value: "DISPUTED",  label: "⚠️ Sengketa" },
  { value: "RESOLVED",  label: "🔒 Diselesaikan" },
];

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-gray-50 px-5 py-4">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="grid grid-cols-4 gap-4 px-5 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="h-3.5 w-20 animate-pulse rounded-full bg-gray-200" />
          </div>
        ))}
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

  const start = Math.max(0, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);
  const visible = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
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
          {end < totalPages - 2 && (
            <span className="px-1 text-gray-400">···</span>
          )}
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

export default function OrderListPage({
  role,
  pageTitle,
  pageSubtitle,
}: Props) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  const loadOrders = useCallback(
    (page: number, status: OrderStatus | "") => {
      let isMounted = true;

      function applyResult(data: OrderSummary[], total: number, pages: number) {
        if (isMounted) {
          setOrders(data);
          setTotalElements(total);
          setTotalPages(pages);
          setCurrentPage(page);
          setLoading(false);
          setError(null);
        }
      }

      function applyError(msg: string) {
        if (isMounted) {
          setError(msg);
          setLoading(false);
        }
      }

      async function fetchData() {
        if (isMounted) setLoading(true);

        try {
          const res = await fetchOrders({
            role,
            status: status || undefined,
            page,
            size: 10,
          });
          applyResult(res.content ?? [], res.totalElements, res.totalPages);
        } catch (err) {
          applyError(
            err instanceof Error
              ? err.message
              : "Gagal memuat daftar pesanan."
          );
        }
      }

      fetchData();

      return () => {
        isMounted = false;
      };
    },
    [role]
  );

  useEffect(() => {
    const cleanup = loadOrders(0, statusFilter);
    return cleanup;
  }, [loadOrders, statusFilter]);

  const handleStatusChange = useCallback(
    (status: OrderStatus | "") => {
      setStatusFilter(status);
      // loadOrders akan dipanggil ulang via useEffect dep statusFilter
    },
    []
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const cleanup = loadOrders(page, statusFilter);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return cleanup;
    },
    [loadOrders, statusFilter]
  );

  return (
    <main className="min-h-screen bg-[#f6f4ef]">
      {/* Header */}
      <div className="bg-[#002447] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="mt-1 text-sm text-white/70">{pageSubtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter status */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value as OrderStatus | "")}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === opt.value
                  ? "border-[#002447] bg-[#002447] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#002447]/40 hover:text-[#002447]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-2xl bg-red-50 px-6 py-5 text-sm text-red-600">
            <p className="font-semibold">Gagal memuat pesanan</p>
            <p className="mt-1 text-red-500">{error}</p>
            <button
              onClick={() => loadOrders(0, statusFilter)}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 text-6xl">📭</span>
            <h3 className="text-lg font-semibold text-gray-700">
              Belum ada pesanan
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {statusFilter
                ? "Tidak ada pesanan dengan status yang dipilih."
                : "Pesanan kamu akan muncul di sini."}
            </p>
            {statusFilter && (
              <button
                onClick={() => handleStatusChange("")}
                className="mt-4 rounded-lg bg-[#002447] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b70]"
              >
                Lihat Semua Pesanan
              </button>
            )}
          </div>
        )}

        {/* Order list */}
        {!loading && !error && orders.length > 0 && (
          <>
            <div className="mb-3 text-xs text-gray-400">
              {totalElements} pesanan ditemukan
            </div>
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} viewAs={role} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </main>
  );
}