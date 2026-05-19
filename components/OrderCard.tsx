"use client";
 
import { useState } from "react";
import type { OrderSummary } from "@/types/order";
import { shipOrder, receiveOrder, disputeOrder } from "@/lib/order.api";
import OrderStatusBadge from "./OrderStatusBadge";
 
interface Props {
  order: OrderSummary;
  /** Role sudut pandang tampilan: BUYER atau SELLER */
  viewAs: "BUYER" | "SELLER";
  /** Dipanggil setelah aksi berhasil agar parent me-refresh data */
  onActionSuccess: (orderId: string) => void;
}
 
function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
 
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
 
function ActionError({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}
 
function ShipModal({
  orderId,
  onClose,
  onSuccess,
}: {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  async function handleSubmit() {
    if (!courier.trim() || !trackingNumber.trim()) {
      setError("Kurir dan nomor resi wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await shipOrder(orderId, { courier: courier.trim(), trackingNumber: trackingNumber.trim() });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesanan.");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-[#002447]">Kirim Barang</h3>
 
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nama Kurir
            </label>
            <input
              type="text"
              placeholder="cth. JNE, SiCepat, Anteraja"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full rounded-xl bg-black/5 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#002447]/25"
            />
          </div>
 
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nomor Resi
            </label>
            <input
              type="text"
              placeholder="cth. JNE123456789"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full rounded-xl bg-black/5 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#002447]/25"
            />
          </div>
        </div>
 
        {error && <ActionError message={error} />}
 
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-[#002447] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b70] disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Konfirmasi Pengiriman"}
          </button>
        </div>
      </div>
    </div>
  );
}
 
function DisputeModal({
  orderId,
  onClose,
  onSuccess,
}: {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  async function handleSubmit() {
    if (!reason.trim() || !description.trim()) {
      setError("Alasan dan deskripsi komplain wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await disputeOrder(orderId, {
        reason: reason.trim(),
        description: description.trim(),
        evidenceImages: [],
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan komplain.");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold text-[#002447]">Ajukan Komplain</h3>
        <p className="mb-4 text-sm text-gray-500">
          Sampaikan masalah yang kamu hadapi dengan pesanan ini.
        </p>
 
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Alasan Komplain
            </label>
            <input
              type="text"
              placeholder="cth. Barang tidak sesuai deskripsi"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-black/5 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#002447]/25"
            />
          </div>
 
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Deskripsi Lengkap
            </label>
            <textarea
              rows={4}
              placeholder="Jelaskan masalahmu secara detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl bg-black/5 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#002447]/25"
            />
          </div>
        </div>
 
        {error && <ActionError message={error} />}
 
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Komplain"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderCard({ order, viewAs, onActionSuccess }: Props) {
  const [showShipModal, setShowShipModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);
 
  const isSeller = viewAs === "SELLER";
  const isBuyer = viewAs === "BUYER";
 
  async function handleReceive() {
    setReceiveLoading(true);
    setReceiveError(null);
    try {
      await receiveOrder(order.id);
      onActionSuccess(order.id);
    } catch (err) {
      setReceiveError(
        err instanceof Error ? err.message : "Gagal mengkonfirmasi penerimaan."
      );
    } finally {
      setReceiveLoading(false);
    }
  }
 
  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-50 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-400">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">
              {order.listingTitle}
            </h3>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
 
        {/* Body */}
        <div className="px-5 py-4">
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-gray-400">Pembeli</span>
              <p className="font-medium text-gray-800">
                {order.buyer?.displayName ?? "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Penjual</span>
              <p className="font-medium text-gray-800">
                {order.seller?.displayName ?? "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Total</span>
              <p className="font-semibold text-[#002447]">
                {formatRupiah(order.amount)}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Tanggal</span>
              <p className="text-gray-700">{formatDate(order.createdAt)}</p>
            </div>
          </div>
 
          {/* Info pengiriman fallback */}
          <div className="rounded-xl bg-[#f6f4ef] px-4 py-3 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Pengiriman: </span>
            Menunggu info pengiriman
          </div>
 
          {receiveError && <ActionError message={receiveError} />}
        </div>
 
        {/* Aksi */}
        {(isSeller && order.status === "PACKAGED") ||
        (isBuyer && order.status === "SHIPPED") ? (
          <div className="flex flex-wrap gap-2 border-t border-gray-50 px-5 py-3">
            {/* Seller: Kirim Barang */}
            {isSeller && order.status === "PACKAGED" && (
              <button
                onClick={() => setShowShipModal(true)}
                className="rounded-lg bg-[#002447] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b70]"
              >
                Kirim Barang
              </button>
            )}
 
            {/* Buyer: Konfirmasi Terima */}
            {isBuyer && order.status === "SHIPPED" && (
              <button
                onClick={handleReceive}
                disabled={receiveLoading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                {receiveLoading ? "Memproses..." : "Pesanan Diterima"}
              </button>
            )}
 
            {/* Buyer: Ajukan Komplain */}
            {isBuyer && order.status === "SHIPPED" && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Ajukan Komplain
              </button>
            )}
          </div>
        ) : null}
      </div>
 
      {/* Modals */}
      {showShipModal && (
        <ShipModal
          orderId={order.id}
          onClose={() => setShowShipModal(false)}
          onSuccess={() => {
            setShowShipModal(false);
            onActionSuccess(order.id);
          }}
        />
      )}
 
      {showDisputeModal && (
        <DisputeModal
          orderId={order.id}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => {
            setShowDisputeModal(false);
            onActionSuccess(order.id);
          }}
        />
      )}
    </>
  );
}