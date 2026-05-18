"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderResponse, OrderStatus } from "@/types/order";
import Link from "next/link";

export default function OrdersPage() {
    const { user, isLoading: authLoading } = useAuth();

    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'BUYER' | 'SELLER'>('BUYER');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const url = `/api/orders?role=${activeTab}&page=0&size=20`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error("Gagal memuat daftar transaksi pesanan.");
            }

            const data: OrderResponse = await res.json();
            setOrders(data.content || []);
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user, activeTab]);

    const handleUpdateStatus = async (orderId: string, action: "ship" | "receive") => {
        try {
            const endpoint = `/api/orders/${orderId}/${action}`;
            const res = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: action === "ship" ? JSON.stringify({ courier: "JNT Express", trackingNumber: "JNT987654321" }) : undefined
            });

            if (res.ok) {
                fetchOrders();
            }
        } catch (err) {
            console.error(`Gagal memproses status ${action}:`, err);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getStatusStyle = (status: OrderStatus) => {
        switch (status) {
            case "CREATED": return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
            case "PACKAGED": return "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20";
            case "SHIPPED": return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20";
            case "COMPLETED": return "bg-green-50 text-green-700 ring-1 ring-green-600/20";
            case "DISPUTED": return "bg-red-50 text-red-700 ring-1 ring-red-600/20";
            case "RESOLVED": return "bg-gray-100 text-gray-700";
            default: return "bg-gray-50 text-gray-600";
        }
    };

    if (authLoading || isLoading) {
        return <div className="text-center py-20 text-sm text-gray-500 animate-pulse">Memuat data pesanan...</div>;
    }

    if (!user) {
        return <div className="text-center py-20 text-sm text-red-500">Silakan login untuk memantau transaksi pesanan Anda.</div>;
    }

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-gray-100 pb-4 mb-6">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Transaksi & Pesanan</h1>
                <p className="text-sm text-gray-500 mt-1">Pantau status pengiriman barang lelang yang Anda menangkan atau jual.</p>
            </div>

            {/* TAB TOGGLE PERAN */}
            <div className="flex gap-4 border-b border-gray-200 mb-8 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('BUYER')}
                    className={`pb-3 transition-all ${activeTab === 'BUYER' ? "border-b-2 border-emerald-600 text-emerald-600 font-bold" : "text-gray-400 hover:text-gray-600"}`}
                >
                    Pesanan Saya (Pembeli)
                </button>
                {user.roles.includes('SELLER') && (
                    <button
                        onClick={() => setActiveTab('SELLER')}
                        className={`pb-3 transition-all ${activeTab === 'SELLER' ? "border-b-2 border-emerald-600 text-emerald-600 font-bold" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        Penjualan Saya (Penjual)
                    </button>
                )}
            </div>

            {error && <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 mb-6">{error}</div>}

            {/* DAFTAR PESANAN */}
            {orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-400">
                    Tidak ada riwayat transaksi pesanan pada menu ini.
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                            {/* Info Produk & Detil Flat Berdasarkan Model Java Lu */}
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${getStatusStyle(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <span className="text-[11px] font-mono text-gray-400">ID Order: #{order.id.slice(0, 8)}</span>
                                </div>

                                <h3 className="text-base font-bold text-gray-900">{order.listingTitle}</h3>

                                <div className="text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
                                    {/* Menggunakan order.totalAmount sesuai properti Long model Java lu */}
                                    <p>Total Transaksi: <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span></p>
                                    {/* Menggunakan flat property sellerDisplayName / buyerDisplayName */}
                                    <p>{activeTab === 'BUYER' ? `Penjual: ${order.sellerDisplayName}` : `Pembeli: ${order.buyerDisplayName}`}</p>
                                    <p>Tanggal Transaksi: {new Date(order.createdAt).toLocaleDateString("id-ID")}</p>
                                </div>

                                {/* Tampilkan info kurir jika barang sudah dikirim */}
                                {order.trackingNumber && (
                                    <div className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded-lg p-2.5 max-w-md text-gray-600">
                                        🚚 <span className="font-bold text-gray-900">{order.courier}</span> - Resi: <span className="font-mono bg-white px-1 py-0.5 border rounded">{order.trackingNumber}</span>
                                    </div>
                                )}
                            </div>

                            {/* Bagian Kanan: Aksi Penanganan Alur Sesi */}
                            <div className="flex items-center gap-3 md:self-center">
                                {/* AKSI PENJUAL */}
                                {activeTab === 'SELLER' && order.status === 'CREATED' && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, "ship")}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                                    >
                                        Kirim Barang (Input Resi)
                                    </button>
                                )}

                                {/* AKSI PEMBELI */}
                                {activeTab === 'BUYER' && order.status === 'SHIPPED' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, "receive")}
                                            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                                        >
                                            Konfirmasi Selesai
                                        </button>
                                        <Link
                                            href={`/orders/${order.id}/dispute`}
                                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-center"
                                        >
                                            Ajukan Komplain
                                        </Link>
                                    </>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}