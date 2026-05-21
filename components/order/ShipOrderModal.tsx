"use client";
import { useState, useCallback } from "react";
import { shipOrder } from "@/lib/order.api";

interface Props {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShipOrderModal({ orderId, onClose, onSuccess }: Props) {
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!courier.trim()) {
      setError("Nama kurir wajib diisi.");
      return;
    }
    if (!trackingNumber.trim()) {
      setError("Nomor resi wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await shipOrder(orderId, {
        status: "SHIPPED",
        courier: courier.trim(),
        trackingNumber: trackingNumber.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengupdate pengiriman."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, courier, trackingNumber, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-[#002447]">
            🚚 Input Data Pengiriman
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nama Kurir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="cth. JNE, SiCepat, Anteraja"
              value={courier}
              onChange={(e) => {
                setCourier(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nomor Resi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="cth. JNE1234567890"
              value={trackingNumber}
              onChange={(e) => {
                setTrackingNumber(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
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
            className="rounded-lg bg-[#002447] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b70] disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Konfirmasi Pengiriman"}
          </button>
        </div>
      </div>
    </div>
  );
}