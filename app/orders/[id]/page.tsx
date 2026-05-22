"use client";
import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchOrderDetail, packageOrder, receiveOrder } from "@/lib/order.api";
import { useAuth } from "@/context/AuthContext";
import type { OrderDetail, OrderStatus } from "@/types/order";
import ShipOrderModal from "@/components/order/ShipOrderModal";
import DisputeOrderModal from "@/components/order/DisputeOrderModal";
import { toDate } from "@/lib/utils/dateTime";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = toDate(iso);
  if (!date) return "—";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; icon: string }
> = {
  CREATED:   { label: "Dibuat",        className: "bg-blue-100 text-blue-700 border-blue-200",      icon: "📋" },
  PACKAGED:  { label: "Dikemas",       className: "bg-orange-100 text-orange-700 border-orange-200", icon: "📦" },
  SHIPPED:   { label: "Dikirim",       className: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "🚚" },
  COMPLETED: { label: "Selesai",       className: "bg-green-100 text-green-700 border-green-200",    icon: "✅" },
  DISPUTED:  { label: "Sengketa",      className: "bg-red-100 text-red-700 border-red-200",          icon: "⚠️" },
  RESOLVED:  { label: "Diselesaikan",  className: "bg-gray-100 text-gray-600 border-gray-200",       icon: "🔒" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className, icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${className}`}>
      {icon} {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-50 py-2.5 last:border-none">
      <span className="shrink-0 text-sm text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-48 animate-pulse rounded-full bg-gray-200" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-200 lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Aksi state
  const [packageLoading, setPackageLoading] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadOrder = useCallback(() => {
    let isMounted = true;

    function applyResult(data: OrderDetail) {
      if (isMounted) {
        setOrder(data);
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
        const data = await fetchOrderDetail(id);
        applyResult(data);
      } catch (err) {
        applyError(
          err instanceof Error ? err.message : "Gagal memuat detail pesanan."
        );
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    const cleanup = loadOrder();
    return cleanup;
  }, [loadOrder]);

  const handleReceive = useCallback(async () => {
    let cancelled = false;

    function applyReceiveSuccess() {
      if (!cancelled) {
        setReceiveLoading(false);
        setReceiveError(null);
        setActionSuccess("Pesanan berhasil dikonfirmasi sebagai diterima.");
        loadOrder();
      }
    }

    function applyReceiveError(msg: string) {
      if (!cancelled) {
        setReceiveError(msg);
        setReceiveLoading(false);
      }
    }

    if (!cancelled) {
      setReceiveLoading(true);
      setReceiveError(null);
    }

    try {
      await receiveOrder(id);
      applyReceiveSuccess();
    } catch (err) {
      applyReceiveError(
        err instanceof Error ? err.message : "Gagal mengkonfirmasi penerimaan."
      );
    }

    return () => { cancelled = true; };
  }, [id, loadOrder]);

  const handlePackage = useCallback(async () => {
    setPackageLoading(true);
    setPackageError(null);

    try {
      await packageOrder(id);
      setActionSuccess("Pesanan berhasil ditandai sedang dikemas.");
      loadOrder();
    } catch (err) {
      setPackageError(
        err instanceof Error ? err.message : "Gagal menandai pesanan dikemas."
      );
    } finally {
      setPackageLoading(false);
    }
  }, [id, loadOrder]);

  const handleShipSuccess = useCallback(() => {
    setShowShipModal(false);
    setActionSuccess("Data pengiriman berhasil disimpan.");
    loadOrder();
  }, [loadOrder]);

  const handleDisputeSuccess = useCallback(() => {
    setShowDisputeModal(false);
    setActionSuccess("Komplain berhasil diajukan.");
    loadOrder();
  }, [loadOrder]);

  const isBuyer  = !!user && !!order && user.id === order.buyer.id;
  const isSeller = !!user && !!order && user.id === order.seller.id;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f4ef]">
        <div className="bg-[#002447] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/20" />
          </div>
        </div>
        <DetailSkeleton />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f6f4ef]">
        <div className="bg-[#002447] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Link href="/orders" className="text-sm text-white/70 hover:text-white">
              ← Kembali ke Pesanan
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-red-50 px-6 py-10">
            <span className="text-5xl">😕</span>
            <h2 className="mt-4 text-lg font-semibold text-red-700">
              {error ?? "Pesanan tidak ditemukan"}
            </h2>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={loadOrder}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Coba Lagi
              </button>
              <Link
                href="/orders"
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const listingImage = order.listing.images[0] ?? null;

  const addr = order.buyer.shippingAddress;
  const addressString = [
    addr?.street,
    addr?.city,
    addr?.province,
    addr?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <main className="min-h-screen bg-[#f6f4ef]">
        {/* Breadcrumb */}
        <div className="bg-[#002447] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl items-center gap-2 text-sm text-white/70">
            <Link href="/orders" className="transition-colors hover:text-white">
              Pesanan
            </Link>
            <span>/</span>
            <span className="text-white">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Success banner */}
          {actionSuccess && (
            <div className="mb-5 flex items-center justify-between rounded-2xl bg-green-50 px-5 py-3 text-sm text-green-700">
              <span>✅ {actionSuccess}</span>
              <button
                onClick={() => setActionSuccess(null)}
                className="text-green-500 hover:text-green-700"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3">

            {/* ── Kolom Kiri: Info Utama ── */}
            <div className="space-y-5 lg:col-span-2">

              {/* Card: Header pesanan */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400">ID Pesanan</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-gray-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Card: Detail barang */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-[#002447]">
                  Detail Barang
                </h2>
                <div className="flex gap-4">
                  {/* Gambar barang */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f6f4ef]">
                    {listingImage ? (
                      <Image
                        src={listingImage}
                        alt={order.listing.title}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">
                        🏷️
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 line-clamp-2">
                      {order.listing.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      ID Listing: {order.listing.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-2 text-lg font-bold text-[#002447]">
                      {formatRupiah(order.amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card: Aktor (Pembeli & Penjual) */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-[#002447]">
                  Informasi Transaksi
                </h2>
                <div className="divide-y divide-gray-50">
                  <InfoRow label="Pembeli" value={order.buyer.displayName} />
                  <InfoRow label="Penjual" value={order.seller.displayName} />
                  <InfoRow
                    label="Alamat Pengiriman"
                    value={addressString || "—"}
                  />
                </div>
              </div>

              {/* Card: Info pengiriman (tampil jika shipping tidak null) */}
              {order.shipping && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-[#002447]">
                    🚚 Data Pengiriman
                  </h2>
                  <div className="divide-y divide-gray-50">
                    <InfoRow
                      label="Kurir"
                      value={order.shipping.courier ?? "—"}
                    />
                    <InfoRow
                      label="Nomor Resi"
                      value={
                        order.shipping.trackingNumber ? (
                          <span className="font-mono">
                            {order.shipping.trackingNumber}
                          </span>
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow
                      label="Tanggal Kirim"
                      value={formatDate(order.shipping.shippedAt)}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* ── Kolom Kanan: Aksi ── */}
            <div className="space-y-4">
              <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-[#002447]">
                  Aksi Pesanan
                </h2>

                {/* ── Aksi Buyer: status SHIPPED ── */}
                {isBuyer && order.status === "SHIPPED" && (
                  <div className="space-y-2">
                    <button
                      onClick={handleReceive}
                      disabled={receiveLoading}
                      className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                    >
                      {receiveLoading ? "Memproses..." : "✅ Pesanan Diterima"}
                    </button>
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      ⚠️ Ajukan Komplain
                    </button>
                    {receiveError && (
                      <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                        {receiveError}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Aksi Seller: status PACKAGED ── */}
                {isSeller && order.status === "CREATED" && (
                  <div className="space-y-2">
                    <button
                      onClick={handlePackage}
                      disabled={packageLoading}
                      className="w-full rounded-xl bg-[#002447] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#003b70] disabled:opacity-60"
                    >
                      {packageLoading ? "Memproses..." : "📦 Tandai Dikemas"}
                    </button>
                    {packageError && (
                      <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                        {packageError}
                      </p>
                    )}
                  </div>
                )}

                {isSeller && order.status === "PACKAGED" && (
                  <button
                    onClick={() => setShowShipModal(true)}
                    className="w-full rounded-xl bg-[#002447] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#003b70]"
                  >
                    🚚 Input Resi Pengiriman
                  </button>
                )}

                {/* ── Tidak ada aksi tersedia ── */}
                {!isBuyer && !isSeller && (
                  <p className="text-center text-sm text-gray-400">
                    Kamu tidak terlibat dalam pesanan ini.
                  </p>
                )}

                {(isBuyer || isSeller) &&
                  order.status !== "SHIPPED" &&
                  order.status !== "CREATED" &&
                  order.status !== "PACKAGED" && (
                    <div className="rounded-xl bg-[#f6f4ef] px-4 py-3 text-center">
                      <p className="text-sm text-gray-500">
                        {order.status === "COMPLETED"
                          ? "Pesanan ini sudah selesai."
                          : order.status === "DISPUTED"
                          ? "Pesanan sedang dalam sengketa."
                          : order.status === "RESOLVED"
                          ? "Sengketa sudah diselesaikan."
                          : "Tidak ada aksi yang tersedia saat ini."}
                      </p>
                    </div>
                  )}

                {/* Tombol kembali */}
                <Link
                  href="/orders"
                  className="mt-3 block w-full rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  ← Kembali ke Daftar Pesanan
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Modals ── */}
      {showShipModal && (
        <ShipOrderModal
          orderId={order.id}
          onClose={() => setShowShipModal(false)}
          onSuccess={handleShipSuccess}
        />
      )}

      {showDisputeModal && (
        <DisputeOrderModal
          orderId={order.id}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={handleDisputeSuccess}
        />
      )}
    </>
  );
}
