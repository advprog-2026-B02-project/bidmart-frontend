"use client";

import React from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {canAccessAdminArea, canAccessSellerArea} from "@/lib/navigation";

type NavItem = {
    href: string;
    label: string;
};

export default function Navbar() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const roles = user?.roles ?? [];
    const navItems: NavItem[] = [
        {href: "/", label: "Katalog"},
        ...(user ? [
            {href: "/wallet", label: "Wallet"},
            {href: "/orders", label: "Pesanan"},
            {href: "/notifications", label: "Notifikasi"},
        ] : []),
        ...(user && canAccessSellerArea(roles) ? [
            {href: "/seller/listings", label: "Penjual"},
            {href: "/seller/orders", label: "Pesanan Toko"},] : []),
        ...(user && canAccessAdminArea(roles) ? [{href: "/admin", label: "Admin"}] : []),
    ];

    function isActive(href: string) {
        if (href === "/") {
            return pathname === "/" || pathname.startsWith("/catalog") || pathname.startsWith("/auctions");
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    }

    const handleLogout = async () => {
        await logout();
        router.push("/login");
        router.refresh();
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex min-h-16 items-center justify-between gap-4 py-3">

                    {/* Kiri: Brand Logo */}
                    <div className="flex min-w-0 items-center gap-6">
                        <Link href="/" className="text-xl font-black tracking-tight text-bidnavy">
                            BidMart
                        </Link>

                        {/* Menu Navigasi Utama */}
                        <div className="hidden items-center gap-1 lg:flex">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                                        isActive(item.href)
                                            ? "bg-bidnavy text-white"
                                            : "text-gray-600 hover:bg-bidcream hover:text-bidnavy"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Kanan: Kondisi User Sesi */}
                    <div className="flex shrink-0 items-center gap-3">
                        {isLoading ? (
                            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
                        ) : user ? (
                            <div className="flex items-center gap-3">
                                {/* Informasi Ringkas Profil */}
                                <Link href="/me" className="hidden flex-col text-right sm:flex">
                                    <span className="text-sm font-semibold text-gray-900">{user.displayName}</span>
                                    <span className="text-xs font-medium text-bidnavy bg-bidnavy/10 px-1.5 py-0.5 rounded self-end uppercase tracking-wider">
                                        {user.roles.includes("ADMIN") ? "Admin" : user.roles.includes("SELLER") ? "Seller" : "Buyer"}
                                    </span>
                                </Link>

                                {/* Avatar / Placeholder grafis */}
                                <Link href="/me" className="h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center font-bold text-gray-400 text-sm">
                                            {user.displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </Link>

                                {/* Tombol Keluar Sesi */}
                                <button
                                    onClick={handleLogout}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-bidcream hover:text-red-600 transition-all"
                                >
                                    Keluar
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="text-sm font-semibold text-gray-600 hover:text-bidnavy transition-colors"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-lg bg-bidnavy px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-bidnavy2 transition-colors"
                                >
                                    Daftar
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
                {navItems.length > 1 && (
                    <div className="-mx-4 flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 lg:hidden">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                                    isActive(item.href)
                                        ? "bg-bidnavy text-white"
                                        : "text-gray-600 hover:bg-bidcream hover:text-bidnavy"
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
