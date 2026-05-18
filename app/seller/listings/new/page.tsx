"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function NewListingPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [startingPrice, setStartingPrice] = useState<number>(0);
    const [reservePrice, setReservePrice] = useState<number>(0);
    const [minimumIncrement, setMinimumIncrement] = useState<number>(0);
    const [auctionDuration, setAuctionDuration] = useState<number>(3600);
    const [imageUrl, setImageUrl] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (title.length > 200) {
            setError("Judul barang tidak boleh melebihi 200 karakter.");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            categoryId: categoryId || "00000000-0000-0000-0000-000000000000",
            title,
            description: description || null,
            startingPrice,
            reservePrice,
            minimumIncrement,
            auctionDuration,
            images: imageUrl
                ? [{ url: imageUrl, thumbnailUrl: null, displayOrder: 0 }]
                : []
        };

        try {
            const res = await fetch("/api/catalog/seller/listings/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Gagal membuat listing lelang baru.");
            }

            router.push("/seller/listings");
            router.refresh();
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan koneksi ke server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!authLoading && user && !user.roles.includes("SELLER") && !user.roles.includes("ADMIN")) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-red-500">
                Akses ditolak. Anda tidak memiliki izin untuk membuat listing lelang.
            </div>
        );
    }

    return (
        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="space-y-2 border-b border-gray-100 pb-6 mb-8">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                    Mulai Lelang Baru
                </h1>
                <p className="text-sm text-gray-500">
                    Isi detail informasi barang Anda dengan akurat untuk menarik minat para penawar.
                </p>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100 mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">

                {/* Input Judul */}
                <div>
                    <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                        Judul Barang <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        required
                        maxLength={200}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Contoh: MacBook Pro M3 Max 2024 16GB/512GB (Maksimal 200 karakter)"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Input Kategori & Durasi */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                            ID Kategori (UUID)
                        </label>
                        <input
                            id="category"
                            type="text"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            placeholder="Masukkan UUID Kategori produk"
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="duration" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                            Durasi Lelang (Detik) <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="duration"
                            value={auctionDuration}
                            onChange={(e) => setAuctionDuration(Number(e.target.value))}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value={3600}>1 Jam (3600 detik)</option>
                            <option value={86400}>1 Hari (86400 detik)</option>
                            <option value={259200}>3 Hari (259200 detik)</option>
                            <option value={604800}>7 Hari (604800 detik)</option>
                        </select>
                    </div>
                </div>

                {/* Input Deskripsi */}
                <div>
                    <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                        Deskripsi Detail Barang
                    </label>
                    <textarea
                        id="description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Jelaskan kondisi fisik barang, kelengkapan, kelayakan, serta minus jika ada..."
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Form Finansial: Harga Awal, Cadangan, Kelipatan */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-gray-50 pt-4">
                    <div>
                        <label htmlFor="startingPrice" className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                            Harga Awal (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="startingPrice"
                            type="number"
                            required
                            min={0}
                            value={startingPrice || ""}
                            onChange={(e) => setStartingPrice(Number(e.target.value))}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="reservePrice" className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                            Harga Cadangan (Rp)
                        </label>
                        <input
                            id="reservePrice"
                            type="number"
                            min={0}
                            value={reservePrice || ""}
                            onChange={(e) => setReservePrice(Number(e.target.value))}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="minimumIncrement" className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                            Kelipatan Kelayakan (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="minimumIncrement"
                            type="number"
                            required
                            min={1}
                            value={minimumIncrement || ""}
                            onChange={(e) => setMinimumIncrement(Number(e.target.value))}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* Input Gambar */}
                <div className="border-t border-gray-50 pt-4">
                    <label htmlFor="image" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                        URL Gambar Produk
                    </label>
                    <input
                        id="image"
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://domain-gambar.com/foto-barang.png"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Aksi Form */}
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
                        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? "Menyimpan..." : "Simpan sebagai Draft"}
                    </button>
                </div>

            </form>
        </main>
    );
}