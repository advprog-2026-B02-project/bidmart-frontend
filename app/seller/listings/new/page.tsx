"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Category } from "@/types/catalog";

type CategoryOption = {
    id: string;
    name: string;
    depth: number;
};

function flattenCategories(categories: Category[], depth = 0): CategoryOption[] {
    return categories.flatMap((category) => [
        { id: category.id, name: category.name, depth },
        ...flattenCategories(category.children ?? [], depth + 1),
    ]);
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
    const responseText = await res.text();
    if (!responseText) return fallback;

    try {
        const data = JSON.parse(responseText) as { error?: string; message?: string; detail?: string; title?: string };
        return data.message || data.detail || data.title || data.error || fallback;
    } catch {
        return responseText;
    }
}

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

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

    useEffect(() => {
        let isActive = true;

        async function loadCategories() {
            try {
                setIsLoadingCategories(true);
                const res = await fetch("/api/categories", { cache: "no-store" });
                if (!res.ok) {
                    throw new Error(await readErrorMessage(res, "Gagal memuat kategori."));
                }

                const data = (await res.json()) as Category[];
                if (!isActive) return;

                setCategories(data);
                const options = flattenCategories(data);
                if (options.length > 0) {
                    setCategoryId((current) => current || options[0].id);
                }
            } catch (err) {
                if (!isActive) return;
                const error = err as Error;
                setError(error.message || "Gagal memuat kategori.");
            } finally {
                if (isActive) setIsLoadingCategories(false);
            }
        }

        loadCategories();

        return () => {
            isActive = false;
        };
    }, []);

    const createDefaultCategory = async () => {
        setError(null);
        setIsCreatingCategory(true);

        try {
            const res = await fetch("/api/catalog/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Umum", slug: "umum" }),
            });

            if (!res.ok) {
                throw new Error(await readErrorMessage(res, "Gagal membuat kategori."));
            }

            const category = (await res.json()) as Category;
            setCategories((current) => [...current, category]);
            setCategoryId(category.id);
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Gagal membuat kategori.");
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (title.length > 200) {
            setError("Judul barang tidak boleh melebihi 200 karakter.");
            setIsSubmitting(false);
            return;
        }

        if (!categoryId) {
            setError("Pilih kategori dulu sebelum menyimpan listing.");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            categoryId,
            title,
            description: description || null,
            startingPrice,
            reservePrice: reservePrice || null,
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

            if (!res.ok) {
                const message = await readErrorMessage(res, "Gagal membuat listing lelang baru.");
                throw new Error(message === "Not Found" ? "Kategori tidak ditemukan. Pilih kategori yang tersedia." : message);
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
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy"
                    />
                </div>

                {/* Input Kategori & Durasi */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                            Kategori <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="category"
                            required
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            disabled={isLoadingCategories || categoryOptions.length === 0}
                            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            {isLoadingCategories && <option value="">Memuat kategori...</option>}
                            {!isLoadingCategories && categoryOptions.length === 0 && (
                                <option value="">Belum ada kategori</option>
                            )}
                            {!isLoadingCategories && categoryOptions.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {"--".repeat(category.depth)} {category.name}
                                </option>
                            ))}
                        </select>
                        {!isLoadingCategories && categoryOptions.length === 0 && (
                            <button
                                type="button"
                                onClick={createDefaultCategory}
                                disabled={isCreatingCategory}
                                className="mt-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-bidcream disabled:opacity-50"
                            >
                                {isCreatingCategory ? "Membuat kategori..." : "Buat kategori Umum"}
                            </button>
                        )}
                    </div>

                    <div>
                        <label htmlFor="duration" className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                            Durasi Lelang (Detik) <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="duration"
                            value={auctionDuration}
                            onChange={(e) => setAuctionDuration(Number(e.target.value))}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy"
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
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy"
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
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy"
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
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy"
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
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy"
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
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy"
                    />
                </div>

                {/* Aksi Form */}
                <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6 mt-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-bidcream"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-bidnavy px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-bidnavy2 focus:outline-none focus:ring-2 focus:ring-bidnavy disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? "Menyimpan..." : "Simpan sebagai Draft"}
                    </button>
                </div>

            </form>
        </main>
    );
}
