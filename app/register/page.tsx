"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError("Konfirmasi kata sandi tidak cocok.");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Kata sandi harus minimal 8 karakter.");
            setIsLoading(false);
            return;
        }

        if (displayName.length > 100) {
            setError("Nama tampilan tidak boleh melebihi 100 karakter.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    displayName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Gagal melakukan registrasi.");
            }

            setSuccess("Pendaftaran berhasil! Mengalihkan Anda ke halaman login...");

            setTimeout(() => {
                router.push("/login");
            }, 2000);

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
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-emerald-600">
                        BidMart
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Buat akun baru untuk mulai berpartisipasi dalam lelang
                    </p>
                </div>

                {/* Banner Alert Tampilan Error */}
                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                        {error}
                    </div>
                )}

                {/* Banner Alert Tampilan Sukses */}
                {success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-600 border border-green-100">
                        {success}
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md">
                        {/* Input Nama Tampilan */}
                        <div>
                            <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Tampilan (Display Name) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="display-name"
                                type="text"
                                required
                                maxLength={100}
                                disabled={isLoading}
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                                placeholder="Nama Lengkap / Nama Toko"
                            />
                        </div>

                        {/* Input Email */}
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                                Alamat Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email-address"
                                type="email"
                                required
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                                placeholder="nama@email.com"
                            />
                        </div>

                        {/* Input Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Kata Sandi <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                minLength={8}
                                disabled={isLoading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                                placeholder="•••••••• (Min. 8 Karakter)"
                            />
                        </div>

                        {/* Input Konfirmasi Password */}
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                                Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                required
                                disabled={isLoading}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-xs text-gray-600">
                            Sudah memiliki akun?{" "}
                            <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}