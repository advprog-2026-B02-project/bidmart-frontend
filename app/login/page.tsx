"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {useAuth} from "@/context/AuthContext";
import {getDefaultRoute, getSafeNextPath} from "@/lib/navigation";

export default function LoginPage() {
    const {login} = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function getPendingNextPath() {
        if (typeof window === "undefined") return null;
        const next = new URLSearchParams(window.location.search).get("next");
        return getSafeNextPath(next);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, password}),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || "Alamat email atau kata sandi salah.");
            }

            if (data.requires2FA) {
                const next = getPendingNextPath();
                const nextQuery = next ? `&next=${encodeURIComponent(next)}` : "";
                router.push(`/login/2fa?token=${data.partialToken}${nextQuery}`);
                return;
            }

            login(data.user);
            router.replace(getPendingNextPath() ?? getDefaultRoute(data.user?.roles ?? []));
            router.refresh();
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan koneksi sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-bidcream px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <div>
                    <h2 className="text-center text-3xl font-black tracking-tight text-bidnavy">
                        BidMart
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500">
                        Masuk untuk mulai mengajukan penawaran lelang
                    </p>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="mb-1 block text-sm font-medium text-gray-700">
                                Alamat Email
                            </label>
                            <input
                                id="email-address"
                                type="email"
                                required
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy sm:text-sm"
                                placeholder="nama@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                                Kata Sandi
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                disabled={isLoading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link href="/auth/forgot" className="text-sm font-medium text-bidnavy hover:text-bidnavy2 hover:underline">
                            Lupa kata sandi?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full justify-center rounded-lg border border-transparent bg-bidnavy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-bidnavy2 focus:outline-none focus:ring-2 focus:ring-bidnavy focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isLoading ? "Membuka Sesi..." : "Masuk ke Akun"}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-gray-600">
                            Belum punya akun?{" "}
                            <Link href="/register" className="font-bold text-bidnavy transition-colors hover:text-bidnavy2">
                                Daftar baru di sini
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
