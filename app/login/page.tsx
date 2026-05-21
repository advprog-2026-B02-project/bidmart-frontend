"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
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
        <AuthShell title="Masuk" subtitle="Masuk untuk mulai mengajukan penawaran lelang.">
            {error && (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email-address" className="mb-2 block text-sm font-bold text-bidnavy">
                        Alamat Email
                    </label>
                    <input
                        id="email-address"
                        type="email"
                        required
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy/20"
                        placeholder="nama@email.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-bold text-bidnavy">
                        Kata Sandi
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy/20"
                        placeholder="Masukkan kata sandi"
                    />
                </div>

                <div className="flex justify-end">
                    <Link href="/auth/forgot" className="text-sm font-semibold text-bidnavy hover:text-bidnavy2 hover:underline">
                        Lupa kata sandi?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-xl bg-bidnavy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-bidnavy2 disabled:opacity-50"
                >
                    {isLoading ? "Membuka Sesi..." : "Masuk ke Akun"}
                </button>

                <p className="text-center text-sm text-gray-600">
                    Belum punya akun?{" "}
                    <Link href="/register" className="font-bold text-bidnavy hover:text-bidnavy2">
                        Daftar baru di sini
                    </Link>
                </p>
            </form>
        </AuthShell>
    );
}
