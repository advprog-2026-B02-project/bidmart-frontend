"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
    getTransactions,
    getWallet,
    topUpWallet,
    TransactionResponse,
    WalletResponse,
    withdrawWallet,
} from "@/lib/wallet.api";

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

function formatMoney(value: number) {
    return currency.format(value || 0);
}

function formatDate(value: string) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

const inputClass =
    "mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-base font-medium text-[#002447] outline-none transition focus:border-[#006b70] focus:bg-white focus:ring-4 focus:ring-[#006b70]/10 disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
    "inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#002447] px-5 text-base font-bold text-white shadow-sm transition hover:bg-[#003b70] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500";

const quickAmounts = [25000, 50000, 100000, 250000];

export default function WalletPage() {
    const [wallet, setWallet] = useState<WalletResponse | null>(null);
    const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
    const [topUpAmount, setTopUpAmount] = useState("50000");
    const [withdrawAmount, setWithdrawAmount] = useState("10000");
    const [bankCode, setBankCode] = useState("BCA");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<"topup" | "withdraw" | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const lastUpdated = wallet?.updatedAt ? formatDate(wallet.updatedAt) : "-";
    const hasBackendError = Boolean(error);
    const walletFrozen = Boolean(wallet?.frozen);

    async function refreshWallet() {
        setError(null);
        const [walletData, txPage] = await Promise.all([
            getWallet(),
            getTransactions(0, 10),
        ]);
        setWallet(walletData);
        setTransactions(txPage.content ?? []);
    }

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                await refreshWallet();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal memuat wallet.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function onTopUp(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setMessage(null);
        setSubmitting("topup");

        try {
            const amount = Number(topUpAmount);
            const updated = await topUpWallet(amount);
            setWallet(updated);
            await refreshWallet();
            setMessage("Top up berhasil diproses.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Top up gagal.");
        } finally {
            setSubmitting(null);
        }
    }

    async function onWithdraw(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setMessage(null);
        setSubmitting("withdraw");

        try {
            const amount = Number(withdrawAmount);
            await withdrawWallet({
                amount,
                bankCode,
                accountNumber,
                accountName,
            });
            await refreshWallet();
            setMessage("Withdraw berhasil dibuat.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Withdraw gagal.");
        } finally {
            setSubmitting(null);
        }
    }

    return (
        <main className="min-h-screen bg-[#f3f6fa] text-[#002447]">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#002447] text-lg font-bold text-white">
                            BM
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006b70]">BidMart Wallet</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Saldo dan transaksi</h1>
                        </div>
                    </div>
                    <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        <a href="#overview" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-[#002447]">
                            Ringkasan
                        </a>
                        <a href="#actions" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-[#002447]">
                            Aksi
                        </a>
                        <a href="#transactions" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-[#002447]">
                            Transaksi
                        </a>
                        <Link
                            href="/me"
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[#002447] shadow-sm hover:border-[#002447]/30"
                        >
                            Profil
                        </Link>
                    </nav>
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
                {error ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-red-700">Wallet service belum merespons</p>
                            <p className="mt-1 text-sm text-slate-600">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => refreshWallet().catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat wallet."))}
                            className="h-10 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700 hover:bg-red-50"
                        >
                            Coba lagi
                        </button>
                    </div>
                ) : null}

                {message ? (
                    <div className="rounded-lg border border-bidnavy/20 bg-bidnavy/10 px-4 py-3 text-sm font-semibold text-bidnavy2">
                        {message}
                    </div>
                ) : null}

                <section id="overview" className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                    <div className="rounded-lg bg-[#002447] p-6 text-white shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-white/65">Available balance</p>
                                <p className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                                    {loading ? "Memuat..." : formatMoney(wallet?.availableBalance ?? 0)}
                                </p>
                            </div>
                            <span
                                className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                                    walletFrozen ? "bg-red-100 text-red-700" : "bg-bidnavy/15 text-bidnavy2"
                                }`}
                            >
                                {loading ? "Syncing" : walletFrozen ? "Frozen" : "Active"}
                            </span>
                        </div>
                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg bg-white/10 p-4">
                                <p className="text-xs font-semibold uppercase text-white/55">Total</p>
                                <p className="mt-2 text-lg font-bold">{formatMoney(wallet?.totalBalance ?? 0)}</p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-4">
                                <p className="text-xs font-semibold uppercase text-white/55">Held</p>
                                <p className="mt-2 text-lg font-bold">{formatMoney(wallet?.heldBalance ?? 0)}</p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-4">
                                <p className="text-xs font-semibold uppercase text-white/55">Updated</p>
                                <p className="mt-2 text-sm font-bold">{lastUpdated}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-bold text-slate-500">Hold ratio</p>
                            <p className="mt-2 text-3xl font-bold">
                                {wallet?.totalBalance ? Math.round((wallet.heldBalance / wallet.totalBalance) * 100) : 0}%
                            </p>
                            <div className="mt-4 h-2 rounded-full bg-slate-100">
                                <div
                                    className="h-2 rounded-full bg-[#006b70]"
                                    style={{
                                        width: `${wallet?.totalBalance ? Math.min(100, Math.round((wallet.heldBalance / wallet.totalBalance) * 100)) : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-bold text-slate-500">Latest activity</p>
                            <p className="mt-2 text-3xl font-bold">{transactions.length}</p>
                            <p className="mt-1 text-sm text-slate-500">transaksi ditampilkan</p>
                        </div>
                    </div>
                </section>

                <section id="actions" className="grid gap-4 lg:grid-cols-2">
                    <form onSubmit={onTopUp} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold">Top up</h2>
                                <p className="mt-1 text-sm text-slate-500">Tambahkan saldo ke wallet.</p>
                            </div>
                        </div>
                        <label className="mt-5 block text-sm font-bold text-slate-600" htmlFor="topup-amount">
                            Amount
                        </label>
                        <input
                            id="topup-amount"
                            className={inputClass}
                            type="number"
                            min="1"
                            value={topUpAmount}
                            onChange={(event) => setTopUpAmount(event.target.value)}
                            required
                        />
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {quickAmounts.map((amount) => (
                                <button
                                    key={amount}
                                    type="button"
                                    onClick={() => setTopUpAmount(String(amount))}
                                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 hover:border-[#006b70] hover:bg-white hover:text-[#006b70]"
                                >
                                    {formatMoney(amount).replace(",00", "")}
                                </button>
                            ))}
                        </div>
                        <button className={`${primaryButtonClass} mt-5`} disabled={submitting !== null || walletFrozen || hasBackendError}>
                            {submitting === "topup" ? "Memproses..." : "Top up"}
                        </button>
                    </form>

                    <form onSubmit={onWithdraw} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="text-xl font-bold">Withdraw</h2>
                            <p className="mt-1 text-sm text-slate-500">Tarik saldo ke rekening tujuan.</p>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-bold text-slate-600" htmlFor="withdraw-amount">
                                Amount
                                <input
                                    id="withdraw-amount"
                                    className={inputClass}
                                    type="number"
                                    min="10000"
                                    value={withdrawAmount}
                                    onChange={(event) => setWithdrawAmount(event.target.value)}
                                    required
                                />
                            </label>
                            <label className="block text-sm font-bold text-slate-600" htmlFor="bank-code">
                                Bank
                                <input
                                    id="bank-code"
                                    className={inputClass}
                                    value={bankCode}
                                    onChange={(event) => setBankCode(event.target.value.toUpperCase())}
                                    required
                                />
                            </label>
                            <label className="block text-sm font-bold text-slate-600" htmlFor="account-number">
                                Account number
                                <input
                                    id="account-number"
                                    className={inputClass}
                                    value={accountNumber}
                                    onChange={(event) => setAccountNumber(event.target.value)}
                                    required
                                />
                            </label>
                            <label className="block text-sm font-bold text-slate-600" htmlFor="account-name">
                                Account name
                                <input
                                    id="account-name"
                                    className={inputClass}
                                    value={accountName}
                                    onChange={(event) => setAccountName(event.target.value)}
                                    required
                                />
                            </label>
                        </div>
                        <button className={`${primaryButtonClass} mt-5`} disabled={submitting !== null || walletFrozen || hasBackendError}>
                            {submitting === "withdraw" ? "Memproses..." : "Withdraw"}
                        </button>
                    </form>
                </section>

                <section id="transactions" className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Transaksi terbaru</h2>
                            <p className="mt-1 text-sm text-slate-500">Riwayat mutasi wallet terbaru.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => refreshWallet().catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat wallet."))}
                            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:border-[#002447]/30 hover:bg-slate-50"
                        >
                            Refresh
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-bold">Type</th>
                                    <th className="px-5 py-3 font-bold">Amount</th>
                                    <th className="px-5 py-3 font-bold">Balance after</th>
                                    <th className="px-5 py-3 font-bold">Description</th>
                                    <th className="px-5 py-3 font-bold">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-12 text-center" colSpan={5}>
                                            <div className="mx-auto max-w-sm">
                                                <p className="text-base font-bold text-slate-700">
                                                    {loading ? "Memuat transaksi..." : "Belum ada transaksi"}
                                                </p>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Transaksi akan muncul setelah top up, withdraw, atau proses bidding.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-[#006b70]/10 px-3 py-1 text-xs font-bold text-[#006b70]">
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-bold">{formatMoney(tx.amount)}</td>
                                            <td className="px-5 py-4">{formatMoney(tx.balanceAfter)}</td>
                                            <td className="max-w-[280px] truncate px-5 py-4 text-slate-600">
                                                {tx.description || "-"}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">{formatDate(tx.createdAt)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
