"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
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
                headers: {"Content-Type": "application/json"},
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

            router.push(`/verify?email=${encodeURIComponent(email)}`);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan koneksi sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <div>
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-emerald-600">
                        BidMart
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Buat akun baru untuk mulai berpartisipasi dalam lelang
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md">
                        <div>
                            <label htmlFor="display-name" className="mb-1 block text-sm font-medium text-gray-700">
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
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                                placeholder="Nama Lengkap / Nama Toko"
                            />
                        </div>

                        <div>
                            <label htmlFor="email-address" className="mb-1 block text-sm font-medium text-gray-700">
                                Alamat Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email-address"
                                type="email"
                                required
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                                placeholder="nama@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
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
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                                placeholder="•••••••• (Min. 8 Karakter)"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-700">
                                Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                required
                                disabled={isLoading}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full justify-center rounded-lg border border-transparent bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-600">
                            Sudah memiliki akun?{" "}
                            <Link href="/login" className="font-bold text-emerald-600 transition-colors hover:text-emerald-700">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
