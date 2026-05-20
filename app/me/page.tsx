"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {logout, me} from "@/lib/api";
import {fetchCatalog} from "@/lib/catalog.api";
import {fetchOrders} from "@/lib/order.api";
import {getWallet, WalletResponse} from "@/lib/wallet.api";

interface UserProfile {
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    roles: string[];
    permissions: string[];
    emailVerified?: boolean;
    status?: string;
}

type ProfileStats = {
    wallet: WalletResponse | null;
    activeListings: number | null;
    buyerOrders: number | null;
    sellerOrders: number | null;
};

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

function formatMoney(value?: number | null) {
    return currency.format(value || 0);
}

function getInitials(name: string) {
    return name ? name.charAt(0).toUpperCase() : "?";
}

function roleLabel(roles: string[]) {
    if (roles.includes("ADMIN")) return "Admin";
    if (roles.includes("SELLER")) return "Seller";
    return "Buyer";
}

export default function MePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<ProfileStats>({
        wallet: null,
        activeListings: null,
        buyerOrders: null,
        sellerOrders: null,
    });
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const data = await me();
                const currentUser: UserProfile = {
                    email: data?.email || data?.principal || "Email tidak ditemukan",
                    displayName: data?.displayName || data?.username || "Pengguna Tanpa Nama",
                    avatarUrl: data?.avatarUrl || null,
                    roles: data?.roles || [],
                    permissions: data?.permissions || [],
                    emailVerified: data?.emailVerified,
                    status: data?.status,
                };
                setUser(currentUser);
                setMessage(null);

                setStatsLoading(true);
                const [walletResult, catalogResult, buyerOrdersResult, sellerOrdersResult] = await Promise.allSettled([
                    getWallet(),
                    fetchCatalog({size: 1}),
                    fetchOrders("BUYER", 0, 1),
                    currentUser.roles.includes("SELLER") ? fetchOrders("SELLER", 0, 1) : Promise.resolve(null),
                ]);

                setStats({
                    wallet: walletResult.status === "fulfilled" ? walletResult.value : null,
                    activeListings: catalogResult.status === "fulfilled" ? catalogResult.value.totalElements : null,
                    buyerOrders: buyerOrdersResult.status === "fulfilled" ? buyerOrdersResult.value.totalElements : null,
                    sellerOrders:
                        sellerOrdersResult.status === "fulfilled" && sellerOrdersResult.value
                            ? sellerOrdersResult.value.totalElements
                            : null,
                });
            } catch (err: unknown) {
                setMessage(err instanceof Error ? err.message : "Belum login / sesi habis.");
            } finally {
                setLoading(false);
                setStatsLoading(false);
            }
        })();
    }, []);

    async function onLogout() {
        try {
            await logout();
            router.push("/login");
        } catch {
            // noop
        }
    }

    const canOpenAdmin = Boolean(
        user?.roles.includes("ADMIN") ||
        user?.permissions.some((permission) => permission.startsWith("ADMIN_"))
    );

    return (
        <main className="min-h-screen bg-bidcream text-bidnavy">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
                <header className="flex flex-col gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-bidnavy2">Profil BidMart</p>
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Akun dan aktivitas</h1>
                </header>

                {message ? (
                    <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-bold text-red-700">{message}</p>
                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="mt-4 rounded-lg bg-bidnavy px-4 py-2 text-sm font-bold text-white hover:bg-bidnavy2"
                        >
                            Masuk
                        </button>
                    </section>
                ) : (
                    <>
                        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-bidnavy text-white shadow-sm">
                                        {user?.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.displayName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-4xl font-black">
                                                {getInitials(user?.displayName || "")}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-2xl font-black">{user?.displayName}</h2>
                                            <span className="rounded-md bg-bidnavy/10 px-2 py-1 text-xs font-bold uppercase text-bidnavy">
                                                {roleLabel(user?.roles || [])}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-sm font-medium text-slate-500">{user?.email}</p>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                            <InfoPill label="Status" value={user?.status || "ACTIVE"} />
                                            <InfoPill label="Email" value={user?.emailVerified === false ? "Belum verified" : "Verified"} />
                                            <InfoPill label="Permissions" value={`${user?.permissions.length || 0}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-sm font-bold text-slate-500">Quick actions</p>
                                <div className="mt-4 grid gap-3">
                                    <ActionLink href="/me/edit" label="Edit Profil" />
                                    <ActionLink href="/wallet" label="Buka Wallet" />
                                    <ActionLink href="/me/sessions" label="Kelola Sesi Aktif" />
                                    <ActionLink href="/me/2fa" label="Kelola 2FA" />
                                    {canOpenAdmin ? <ActionLink href="/admin" label="Dashboard Admin" /> : null}
                                    <button
                                        type="button"
                                        onClick={onLogout}
                                        className="rounded-lg border border-red-200 px-4 py-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-50"
                                    >
                                        Keluar dari Sesi
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Available balance"
                                value={stats.wallet ? formatMoney(stats.wallet.availableBalance) : "-"}
                                detail={stats.wallet?.frozen ? "Wallet frozen" : "Saldo siap dipakai"}
                                loading={loading || statsLoading}
                            />
                            <StatCard
                                label="Held balance"
                                value={stats.wallet ? formatMoney(stats.wallet.heldBalance) : "-"}
                                detail="Saldo tertahan untuk bid/order"
                                loading={loading || statsLoading}
                            />
                            <StatCard
                                label="Katalog aktif"
                                value={stats.activeListings === null ? "-" : String(stats.activeListings)}
                                detail="Listing yang sedang tampil"
                                loading={loading || statsLoading}
                            />
                            <StatCard
                                label="Order saya"
                                value={stats.buyerOrders === null ? "-" : String(stats.buyerOrders)}
                                detail="Sebagai buyer"
                                loading={loading || statsLoading}
                            />
                        </section>

                        {user?.roles.includes("SELLER") ? (
                            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-bidnavy2">
                                            Seller activity
                                        </p>
                                        <h2 className="mt-2 text-2xl font-black">Dashboard penjual</h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Kelola listing, cek order masuk, dan pantau aktivitas penjualan.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:items-end">
                                        <p className="text-sm font-bold text-slate-500">Order sebagai seller</p>
                                        <p className="text-3xl font-black">
                                            {stats.sellerOrders === null ? "-" : stats.sellerOrders}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <Link
                                        href="/seller/listings"
                                        className="rounded-lg bg-bidnavy px-4 py-2 text-sm font-bold text-white hover:bg-bidnavy2"
                                    >
                                        Listing Saya
                                    </Link>
                                    <Link
                                        href="/orders"
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-bidnavy hover:bg-bidcream"
                                    >
                                        Order
                                    </Link>
                                </div>
                            </section>
                        ) : null}
                    </>
                )}
            </div>
        </main>
    );
}

function InfoPill({label, value}: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-bidcream px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-black text-bidnavy">{value}</p>
        </div>
    );
}

function ActionLink({href, label}: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-bidnavy transition hover:bg-bidcream"
        >
            {label}
        </Link>
    );
}

function StatCard({
    label,
    value,
    detail,
    loading,
}: {
    label: string;
    value: string;
    detail: string;
    loading: boolean;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-3 text-2xl font-black">{loading ? "Memuat..." : value}</p>
            <p className="mt-2 text-sm font-medium text-slate-500">{detail}</p>
        </div>
    );
}
