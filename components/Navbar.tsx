"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
        router.refresh();
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">

                    {/* Kiri: Brand Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-black tracking-tight text-emerald-600">
                            BidMart
                        </Link>

                        {/* Menu Navigasi Utama */}
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                            <Link href="/" className="hover:text-emerald-600 transition-colors">
                                Katalog Lelang
                            </Link>
                            {user?.roles.includes("SELLER") && (
                                <Link href="/seller/listings" className="hover:text-emerald-600 transition-colors">
                                    Dashboard Penjual
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Kanan: Kondisi User Sesi */}
                    <div className="flex items-center gap-4">
                        {isLoading ? (
                            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
                        ) : user ? (
                            <div className="flex items-center gap-4">
                                {/* Informasi Ringkas Profil */}
                                <div className="hidden sm:flex flex-col text-right">
                                    <span className="text-sm font-semibold text-gray-900">{user.displayName}</span>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded self-end uppercase tracking-wider">
                                        {user.roles.includes("ADMIN") ? "Admin" : user.roles.includes("SELLER") ? "Seller" : "Buyer"}
                                    </span>
                                </div>

                                {/* Avatar / Placeholder grafis */}
                                <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center font-bold text-gray-400 text-sm">
                                            {user.displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Tombol Keluar Sesi */}
                                <button
                                    onClick={handleLogout}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-all"
                                >
                                    Keluar
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                                >
                                    Daftar
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
}