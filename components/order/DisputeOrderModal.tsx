"use client";

import { useState, useCallback } from "react";
import { createDispute } from "@/lib/order.api";

interface Props {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REASON_OPTIONS = [
  { value: "ITEM_NOT_AS_DESCRIBED", label: "Barang tidak sesuai deskripsi" },
  { value: "ITEM_NOT_RECEIVED",     label: "Barang tidak diterima" },
  { value: "ITEM_DAMAGED",          label: "Barang rusak / cacat" },
  { value: "WRONG_ITEM",            label: "Barang yang diterima salah" },
  { value: "OTHER",                 label: "Alasan lainnya" },
];

export default function DisputeOrderModal({
  orderId,
  onClose,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  // Setiap baris satu URL gambar bukti
  const [evidenceRows, setEvidenceRows] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvidenceChange = useCallback((index: number, value: string) => {
    setEvidenceRows((prev) =>
      prev.map((row, i) => (i === index ? value : row))
    );
  }, []);

  const handleAddEvidence = useCallback(() => {
    setEvidenceRows((prev) => [...prev, ""]);
  }, []);

  const handleRemoveEvidence = useCallback((index: number) => {
    setEvidenceRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!reason) {
      setError("Alasan komplain wajib dipilih.");
      return;
    }
    if (!description.trim()) {
      setError("Deskripsi komplain wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const evidenceImages = evidenceRows.filter((url) => url.trim());

      await createDispute(orderId, {
        reason,
        description: description.trim(),
        evidenceImages,
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengajukan komplain."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, reason, description, evidenceRows, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#002447]">
              ⚠️ Ajukan Komplain
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Sampaikan masalah yang kamu hadapi dengan pesanan ini.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {/* Alasan */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Alasan Komplain <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
              >
                <option value="">-- Pilih Alasan --</option>
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Deskripsi Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Jelaskan masalahmu secara detail..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError(null);
                }}
                className="w-full resize-none rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
              />
            </div>

            {/* Bukti gambar */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Bukti Gambar{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (opsional, paste URL)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleAddEvidence}
                  className="rounded-lg border border-[#002447]/20 px-2.5 py-1 text-xs font-semibold text-[#002447] transition-colors hover:bg-[#002447]/5"
                >
                  + Tambah
                </button>
              </div>

              <div className="space-y-2">
                {evidenceRows.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      placeholder={`URL bukti ${index + 1}`}
                      value={url}
                      onChange={(e) =>
                        handleEvidenceChange(index, e.target.value)
                      }
                      className="flex-1 rounded-xl bg-black/5 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#002447]/25"
                    />
                    {evidenceRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(index)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
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
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Komplain"}
          </button>
        </div>
      </div>
    </div>
  );
}