"use client";
 
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchOrders } from "@/lib/order.api";
import type { OrderSummary, OrderRole } from "@/types/order";
import OrderCard from "@/components/OrderCard";
 

function OrderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-gray-50 px-5 py-4">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-gray-100" />
          <div className="h-4 w-56 rounded bg-gray-100" />
        </div>
        <div className="h-5 w-24 rounded-full bg-gray-100" />
      </div>
      <div className="px-5 py-4">
        <div className="mb-3 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 rounded bg-gray-100" />
              <div className="h-4 w-28 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="h-10 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

function EmptyOrders({ role }: { role: OrderRole }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f6f4ef]">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-gray-500">
        {role === "BUYER"
          ? "Kamu belum punya pesanan sebagai pembeli."
          : "Kamu belum punya pesanan sebagai penjual."}
      </p>
      <p className="mt-1 text-sm text-gray-400">
        Pesanan akan muncul di sini setelah kamu memenangkan lelang.
      </p>
    </div>
  );
}
 
function OrdersError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl bg-red-50 px-6 py-8 text-center">
      <p className="mb-1 font-semibold text-red-600">Gagal memuat pesanan</p>
      <p className="mb-4 text-sm text-red-500">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-[#002447] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b70]"
      >
        Coba Lagi
      </button>
    </div>
  );
}
 
export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
 
  const isSeller = user?.roles?.includes("SELLER") ?? false;
 
  const [activeTab, setActiveTab] = useState<OrderRole>("BUYER");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const loadOrders = useCallback(async (role: OrderRole) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOrders(role);
      // Normalisasi paginated response; fallback ke array kosong jika content null
      setOrders(res.content ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui."
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);
 
  // Load saat tab berubah atau auth selesai
  useEffect(() => {
    if (!authLoading) {
      loadOrders(activeTab);
    }
  }, [activeTab, authLoading, loadOrders]);
 
  // Refresh satu kartu tanpa reload seluruh list
  function handleActionSuccess(orderId: string) {
    // Re-fetch seluruh list untuk tab saat ini agar status ter-update
    // (data list tidak punya detail shipping, cukup refresh status)
    loadOrders(activeTab);
    void orderId;
  }
 
  function handleTabChange(tab: OrderRole) {
    if (tab === activeTab) return;
    setActiveTab(tab);
  }
 

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {[...Array(3)].map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      </main>
    );
  }
 
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef]">
        <p className="text-gray-500">Silakan login untuk melihat pesanan kamu.</p>
      </main>
    );
  }
 
  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#002447]">Pesanan Saya</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pantau semua pesanan dan statusnya di sini.
          </p>
        </div>
 
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
          <button
            onClick={() => handleTabChange("BUYER")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              activeTab === "BUYER"
                ? "bg-[#002447] text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Sebagai Pembeli
          </button>
 
          {/* Tab SELLER hanya tampil jika user memiliki role SELLER */}
          {isSeller && (
            <button
              onClick={() => handleTabChange("SELLER")}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
                activeTab === "SELLER"
                  ? "bg-[#002447] text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Sebagai Penjual
            </button>
          )}
        </div>
 
        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <OrderSkeleton key={i} />
              ))}
            </>
          ) : error ? (
            <OrdersError
              message={error}
              onRetry={() => loadOrders(activeTab)}
            />
          ) : orders.length === 0 ? (
            <EmptyOrders role={activeTab} />
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                viewAs={activeTab}
                onActionSuccess={handleActionSuccess}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}