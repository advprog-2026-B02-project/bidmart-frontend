"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {logout, me} from "@/lib/api";

interface UserProfile {
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    roles?: string[];
    permissions?: string[];
    emailVerified?: boolean;
    status?: string;
}

export default function MePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [msg, setMsg] = useState<string>("Memuat sesi...");
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const data = await me();
                setUser({
                    email: data?.email || data?.principal || "Email tidak ditemukan",
                    displayName: data?.displayName || data?.username || "Pengguna Tanpa Nama",
                    avatarUrl: data?.avatarUrl || null,
                    roles: data?.roles || [],
                    permissions: data?.permissions || [],
                    emailVerified: data?.emailVerified,
                    status: data?.status,
                });
                setMsg("");
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Belum login / sesi habis.";
                setMsg(message);
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

    const initials = user?.displayName?.charAt(0).toUpperCase() || "?";
    const primaryRole = user?.roles?.includes("ADMIN")
        ? "ADMIN"
        : user?.roles?.includes("SELLER")
            ? "SELLER"
            : "BUYER";
    const canOpenAdmin = user?.roles?.includes("ADMIN");
    const canOpenSeller = user?.roles?.includes("SELLER");

    return (
        <main className="min-h-screen bg-bidcream px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bidnavy/60">BidMart Account</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-bidnavy sm:text-4xl">
                        Akun dan Aktivitas
                    </h1>
                </section>

                {msg ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                        {msg}
                    </div>
                ) : (
                    <>
                        <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-bidnavy text-white">
                                        {user?.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.displayName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-4xl font-black">
                                                {initials}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-2xl font-black text-bidnavy">
                                                {user?.displayName}
                                            </h2>
                                            <span className="rounded-md bg-bidnavy/10 px-2 py-1 text-xs font-bold text-bidnavy">
                                                {primaryRole}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-sm font-medium text-gray-500">{user?.email}</p>

                                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                            <ProfileStat label="Status" value={user?.status || "ACTIVE"} />
                                            <ProfileStat label="Email" value={user?.emailVerified === false ? "Belum verified" : "Verified"} />
                                            <ProfileStat label="Permissions" value={String(user?.permissions?.length || 0)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="text-sm font-black text-gray-500">Quick actions</h2>
                                <div className="mt-5 space-y-3">
                                    <ActionButton label="Edit Profil" onClick={() => router.push("/me/edit")} />
                                    <ActionButton label="Buka Wallet" onClick={() => router.push("/wallet")} />
                                    <ActionButton label="Kelola Sesi Aktif" onClick={() => router.push("/me/sessions")} />
                                    <ActionButton label="Kelola 2FA" onClick={() => router.push("/me/2fa")} />
                                    {canOpenAdmin && <ActionButton label="Dashboard Admin" onClick={() => router.push("/admin")} />}
                                    <button
                                        onClick={onLogout}
                                        className="w-full rounded-lg border border-red-200 px-4 py-3 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                                    >
                                        Keluar dari Sesi
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 md:grid-cols-4">
                            <ProfileStatCard label="Available Balance" value="-" description="Saldo siap dipakai" />
                            <ProfileStatCard label="Held Balance" value="-" description="Saldo tertahan untuk bid/order" />
                            <ProfileStatCard label="Katalog Aktif" value="-" description="Listing yang sedang tampil" />
                            <ProfileStatCard label="Order Saya" value="0" description="Sebagai buyer" />
                        </section>

                        {canOpenSeller && (
                            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.25em] text-bidnavy/70">
                                            Seller Activity
                                        </p>
                                        <h2 className="mt-2 text-2xl font-black text-bidnavy">Dashboard penjual</h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Kelola listing, cek order masuk, dan pantau aktivitas penjualan.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push("/seller/listings")}
                                        className="rounded-lg bg-bidnavy px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-bidnavy2"
                                    >
                                        Buka Dashboard
                                    </button>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

function ProfileStat({label, value}: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-bidcream px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">{label}</p>
            <p className="mt-2 text-sm font-black text-bidnavy">{value}</p>
        </div>
    );
}

function ProfileStatCard({label, value, description}: { label: string; value: string; description: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">{label}</p>
            <p className="mt-5 text-3xl font-black text-bidnavy">{value}</p>
            <p className="mt-3 text-sm font-medium text-gray-500">{description}</p>
        </div>
    );
}

function ActionButton({label, onClick}: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-sm font-bold text-bidnavy transition-colors hover:bg-bidcream"
        >
            {label}
        </button>
    );
}
