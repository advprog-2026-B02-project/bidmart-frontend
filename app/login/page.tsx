"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Alamat email atau kata sandi salah.");
            }

            if (data.requires2FA) {
                console.log("[Auth] Akun terproteksi 2FA, mengalihkan ke verifikasi...");
                router.push(`/login/2fa?token=${data.partialToken}`);
                return;
            }

            login(data.user);
            router.push("/");
            router.refresh();

        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan koneksi sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-center text-3xl font-black tracking-tight text-emerald-600">
                        BidMart
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500">
                        Masuk untuk mulai mengajukan penawaran lelang
                    </p>
                </div>

                {error && (
                    <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                                Alamat Email
                            </label>
                            <input
                                id="email-address"
                                type="email"
                                required
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                placeholder="nama@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Kata Sandi
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                disabled={isLoading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? "Membuka Sesi..." : "Masuk ke Akun"}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-xs text-gray-600">
                            Belum punya akun?{" "}
                            <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                Daftar baru di sini
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}