"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Wallet, WalletTransaction } from "@/types/wallet";

export default function WalletPage() {
    const { user, isLoading: authLoading } = useAuth();

    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [topUpAmount, setTopUpAmount] = useState<number>(0);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchWalletData = async () => {
        try {
            setIsLoading(true);

            const walletRes = await fetch("/api/wallet/info");
            if (walletRes.ok) {
                const walletData = await walletRes.json();
                setWallet(walletData);
            }

            const txRes = await fetch("/api/wallet/transactions");
            if (txRes.ok) {
                const txData = await txRes.json();
                setTransactions(txData.content || txData || []);
            }
        } catch (err) {
            console.error("Gagal memuat data dompet:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                fetchWalletData();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (topUpAmount <= 0 || wallet?.frozen) return;

        try {
            setIsSubmitting(true);
            setMessage(null);

            const idempotencyKey = crypto.randomUUID();

            const res = await fetch("/api/wallet/topup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": idempotencyKey
                },
                body: JSON.stringify({ amount: topUpAmount }),
            });

            if (!res.ok) throw new Error("Gagal melakukan top-up.");

            setMessage({ type: "success", text: "Top-up saldo berhasil diproses!" });
            setTopUpAmount(0);
            fetchWalletData();
        } catch (err: unknown) {
            const error = err as Error;
            setMessage({ type: "error", text: error.message || "Terjadi kesalahan." });
        } finally {
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (authLoading || isLoading) {
        return <div className="text-center py-20 text-sm text-gray-500 animate-pulse">Memuat informasi dompet...</div>;
    }

    if (!user) {
        return <div className="text-center py-20 text-sm text-red-500">Silakan login terlebih dahulu untuk mengakses dompet.</div>;
    }

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-gray-100 pb-6 mb-8">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Dompet Digital</h1>
                <p className="text-sm text-gray-500">Pantau saldo, dana jaminan lelang, dan riwayat mutasi keuangan Anda.</p>
            </div>

            {/* ALERT JIKA WALLET DIBEKUKAN */}
            {wallet?.frozen && (
                <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">
                    ⚠️ Dompet Anda saat ini sedang dibekukan (Frozen). Anda tidak dapat melakukan transaksi atau penawaran hingga pembekuan dicabut.
                </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                {/* KIRI: Ringkasan Saldo & Top Up */}
                <div className="space-y-6 lg:col-span-1">

                    <div className={`bg-gradient-to-br p-6 rounded-2xl text-white shadow-sm ${wallet?.frozen ? "from-gray-600 to-gray-700" : "from-emerald-600 to-teal-700"
                        }`}>
                        <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Saldo Tersedia</p>
                        <p className="text-3xl font-black mt-1">{formatPrice(wallet?.availableBalance || 0)}</p>

                        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-medium text-emerald-200 uppercase tracking-wider">Dana Ditahan (Jaminan Bid)</p>
                                <p className="text-sm font-bold mt-0.5">{formatPrice(wallet?.heldBalance || 0)}</p>
                            </div>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded font-semibold backdrop-blur-sm uppercase tracking-wide">
                                {wallet?.frozen ? "Frozen" : "Active"}
                            </span>
                        </div>
                    </div>

                    {/* Form Top Up */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Isi Ulang Saldo</h3>

                        {message && (
                            <div className={`mb-4 rounded-lg p-3 text-xs font-medium border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleTopUp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Nominal Top Up (Rp)</label>
                                <input
                                    type="number"
                                    min={10000}
                                    required
                                    disabled={wallet?.frozen}
                                    value={topUpAmount || ""}
                                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                                    placeholder="Minimal Rp 10.000"
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || topUpAmount <= 0 || wallet?.frozen}
                                className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? "Memproses..." : "Isi Saldo"}
                            </button>
                        </form>
                    </div>

                </div>

                {/* KANAN: Tabel Riwayat Transaksi */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Riwayat Transaksi Dompet</h3>

                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-xs text-gray-400">Belum ada aktivitas mutasi keuangan di akun Anda.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="py-3 px-4">ID Transaksi</th>
                                        <th className="py-3 px-4">Tipe</th>
                                        <th className="py-3 px-4">Deskripsi</th>
                                        <th className="py-3 px-4 text-right">Saldo Akhir</th>
                                        <th className="py-3 px-4 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium text-gray-900">
                                    {transactions.map((tx) => {
                                        // FIX: Cek tipe transaksi sesuai enum Java lu (TOPUP, RELEASE, PAYMENT_RECEIVED)
                                        const isPositive = tx.type === "TOPUP" || tx.type === "RELEASE" || tx.type === "PAYMENT_RECEIVED";
                                        return (
                                            <tr key={tx.id} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-4 text-gray-400 font-mono">#{tx.id.toString().slice(0, 8)}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${isPositive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
                                                        }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">{tx.description || "-"}</td>
                                                {/* Menampilkan balanceAfter dari model lu */}
                                                <td className="py-3 px-4 text-right text-gray-400">{formatPrice(tx.balanceAfter)}</td>
                                                <td className={`py-3 px-4 text-right font-bold ${isPositive ? "text-green-600" : "text-gray-900"
                                                    }`}>
                                                    {isPositive ? "+" : "-"} {formatPrice(tx.amount)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}