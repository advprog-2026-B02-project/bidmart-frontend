"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types/order";

export default function DisputeOrderPage() {
    const { id } = useParams();
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [order, setOrder] = useState<Order | null>(null);
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [evidenceUrl, setEvidenceUrl] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/orders/${id}`);
                if (!res.ok) throw new Error("Pesanan tidak ditemukan.");

                const data: Order = await res.json();
                setOrder(data);

                if (user && data.buyerId !== user.id) {
                    throw new Error("Akses ditolak. Anda bukan pembeli dari transaksi ini.");
                }
            } catch (err: unknown) {
                const error = err as Error;
                setError(error.message || "Gagal memuat detail pesanan.");
            } finally {
                setIsLoading(false);
            }
        };

        if (id && user) {
            fetchOrderDetail();
        }
    }, [id, user]);

    const handleSubmitDispute = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const payload = {
            reason,
            description,
            evidenceImages: evidenceUrl ? [evidenceUrl] : []
        };

        try {
            const idempotencyKey = crypto.randomUUID();

            const res = await fetch(`/api/orders/${id}/dispute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": idempotencyKey
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal mengirimkan pengajuan komplain.");
            }

            router.push("/orders");
            router.refresh();
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan sistem.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || isLoading) {
        return <div className="text-center py-20 text-sm text-gray-500 animate-pulse">Memuat data verifikasi sengketa...</div>;
    }

    if (error && !order) {
        return <div className="text-center py-20 text-sm text-red-500 font-semibold">{error}</div>;
    }

    return (
        <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-gray-100 pb-4 mb-6">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Ajukan Komplain Sengketa</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Laporkan masalah transaksi untuk pesanan produk: <span className="font-bold text-gray-900">{order?.listingTitle}</span>
                </p>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmitDispute} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">

                {/* Input Ringkasan Alasan Sengketa */}
                <div>
                    <label htmlFor="reason" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                        Alasan Utama Komplain <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="reason"
                        type="text"
                        required
                        maxLength={255}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Contoh: Barang rusak saat sampai / Spesifikasi tidak sesuai deskripsi"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Input Penjelasan Deskripsi Kronologi Sengketa */}
                <div>
                    <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                        Penjelasan Kronologi Detail <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        rows={5}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ceritakan secara detail kronologi masalah, kondisi kemasan paket, beserta ketidaksesuaian barang lelang yang diterima..."
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Input URL Bukti Foto */}
                <div>
                    <label htmlFor="evidence" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                        URL Foto Barang Bukti (Evidence Image)
                    </label>
                    <input
                        id="evidence"
                        type="url"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://domain-bukti.com/foto-unboxing.png"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="mt-1.5 text-[11px] text-gray-400">
                        Sangat disarankan menyertakan link foto unboxing paket sebagai bahan evaluasi peninjauan Admin.
                    </p>
                </div>

                {/* Tombol Pengiriman Aksi Form */}
                <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6 mt-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? "Mengirimkan Laporan..." : "Kirim Laporan Sengketa"}
                    </button>
                </div>

            </form>
        </main>
    );
}