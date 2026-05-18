"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function TwoFactorAuthContent() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const partialToken = searchParams.get("token");

    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!partialToken) {
            router.push("/login");
        }
    }, [partialToken, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (code.length !== 6) {
            setError("Kode TOTP harus terdiri dari 6 digit angka.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    partialToken,
                    method: "TOTP",
                    code,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Kode verifikasi yang Anda masukkan salah.");
            }

            login(data.user || data);

            router.push("/");
            router.refresh();
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan sistem. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-center text-2xl font-black tracking-tight text-gray-900">
                        Autentikasi Dua Faktor
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500">
                        Akun Anda dilindungi oleh 2FA. Masukkan 6 digit kode dari aplikasi autentikator Anda (seperti Google Authenticator).
                    </p>
                </div>

                {error && (
                    <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
                        {error}
                    </div>
                )}

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="totp-code" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                            Kode Verifikasi Keamanan
                        </label>
                        <input
                            id="totp-code"
                            type="text"
                            maxLength={6}
                            required
                            pattern="\d*"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            className="block w-full tracking-[1em] text-center text-2xl font-black px-3 py-3 border border-gray-300 rounded-xl placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={isLoading || !partialToken}
                            className="w-full flex justify-center py-2.5 px-4 text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? "Memverifikasi..." : "Verifikasi & Masuk"}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="w-full justify-center text-xs font-semibold text-gray-500 hover:text-gray-700 text-center transition-colors"
                        >
                            Kembali ke Halaman Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TwoFactorAuthPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-sm font-bold text-gray-500 animate-pulse">
                    Memuat Gerbang Keamanan...
                </div>
            </div>
        }>
            <TwoFactorAuthContent />
        </Suspense>
    );
}