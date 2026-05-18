"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ListingDetail } from "@/types/catalog";

export default function SellerDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [listings, setListings] = useState<ListingDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const fetchSellerListings = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/catalog/seller/listings");

            if (!res.ok) {
                throw new Error("Gagal mengambil data lelang Anda.");
            }

            const data = await res.json();

            setListings(Array.isArray(data) ? data : (data.content || []));

        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                fetchSellerListings();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleActivate = async (listingId: string) => {
        try {
            setActionLoadingId(listingId);
            setError(null);

            const res = await fetch(`/api/catalog/seller/listings/${listingId}/activate`, {
                method: "PATCH",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal mengaktifkan lelang.");
            }

            await fetchSellerListings();
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan saat mengaktifkan lelang.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (!authLoading && user && !user.roles.includes("SELLER") && !user.roles.includes("ADMIN")) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-red-500">
                Akses ditolak. Anda harus terdaftar sebagai Penjual untuk melihat halaman ini.
            </div>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            {/* Top Header Section */}
            <div className="sm:flex sm:items-center sm:justify-between border-b border-gray-100 pb-6 mb-8">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                        Dashboard Penjual
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Kelola barang dagangan Anda, pantau tawaran aktif, dan rilis lelang baru.
                    </p>
                </div>
                <div className="mt-4 sm:ml-4 sm:mt-0">
                    <Link
                        href="/seller/listings/new"
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                        Mulai Lelang Baru
                    </Link>
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 mb-6">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {(isLoading || authLoading) && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-12 bg-gray-200 rounded-xl" />
                    <div className="h-20 bg-gray-200 rounded-xl" />
                    <div className="h-20 bg-gray-200 rounded-xl" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !authLoading && !error && listings.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-medium text-gray-400 mb-4">Anda belum memasang barang lelang apa pun.</p>
                    <Link
                        href="/seller/listings/new"
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                    >
                        Buat listing pertama Anda &rarr;
                    </Link>
                </div>
            )}

            {/* Tabel Informasi Dagangan Seller */}
            {!isLoading && !authLoading && listings.length > 0 && (
                <div className="overflow-hidden bg-white shadow-sm border border-gray-100 rounded-2xl">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-100 text-left">
                            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th scope="col" className="py-4 px-6">Barang</th>
                                    <th scope="col" className="py-4 px-6">Status</th>
                                    <th scope="col" className="py-4 px-6">Harga Awal</th>
                                    <th scope="col" className="py-4 px-6">Harga Sekarang</th>
                                    <th scope="col" className="py-4 px-6">Aktivitas & Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-900">
                                {listings.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 flex items-center gap-4">
                                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                                {item.images && item.images.length > 0 ? (
                                                    <img src={item.images[0].url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100" />
                                                )}
                                            </div>
                                            <div className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-[300px]">
                                                {item.title}
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${item.status === "ACTIVE"
                                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/10"
                                                : item.status === "DRAFT"
                                                    ? "bg-gray-100 text-gray-600"
                                                    : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10"
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6 text-gray-500">{formatPrice(item.startingPrice)}</td>
                                        <td className="py-4 px-6 font-bold text-gray-900">{formatPrice(item.currentPrice)}</td>

                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-gray-500 font-semibold">{item.bidCount} Bidder</span>
                                                <Link
                                                    href={`/auctions/${item.id}`}
                                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 whitespace-nowrap"
                                                >
                                                    Lihat Detail
                                                </Link>

                                                {item.status === "DRAFT" && (
                                                    <button
                                                        onClick={() => handleActivate(item.id)}
                                                        disabled={actionLoadingId === item.id}
                                                        className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                                                    >
                                                        {actionLoadingId === item.id ? "Memproses..." : "Aktifkan Lelang"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
}