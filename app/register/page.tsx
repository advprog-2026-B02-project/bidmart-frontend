"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import type {Role} from "@/types/auth";
import {normalizeRole} from "@/lib/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<Role>("BUYER");

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
                    role,
                }),
            });

            const rawResponse = await res.text();
            const data = rawResponse ? JSON.parse(rawResponse) : {};

            if (!res.ok) {
                throw new Error(data.message || "Gagal melakukan registrasi.");
            }

            router.replace(`/verify?email=${encodeURIComponent(email)}&role=${role}`);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan koneksi sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell title="Daftar Akun" subtitle="Pilih peran dan buat akun BidMart baru.">
            {error && (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="display-name" className="mb-2 block text-sm font-bold text-bidnavy">
                        Nama Tampilan
                    </label>
                    <input
                        id="display-name"
                        type="text"
                        required
                        maxLength={100}
                        disabled={isLoading}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy/20"
                        placeholder="Nama Lengkap / Nama Toko"
                    />
                </div>

                <div>
                    <span className="mb-2 block text-sm font-bold text-bidnavy">Daftar sebagai</span>
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
                        {(["BUYER", "SELLER"] as Role[]).map((option) => (
                            <button
                                key={option}
                                type="button"
                                disabled={isLoading}
                                onClick={() => setRole(normalizeRole(option))}
                                className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                                    role === option
                                        ? "bg-bidnavy text-white shadow-sm"
                                        : "text-gray-600 hover:bg-white"
                                }`}
                            >
                                {option === "BUYER" ? "Buyer" : "Seller"}
                            </button>
                        ))}
                    </div>
                </div>

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
                        minLength={8}
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy/20"
                        placeholder="Minimal 8 karakter"
                    />
                </div>

                <div>
                    <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-bidnavy">
                        Konfirmasi Kata Sandi
                    </label>
                    <input
                        id="confirm-password"
                        type="password"
                        required
                        disabled={isLoading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-bidnavy focus:outline-none focus:ring-2 focus:ring-bidnavy/20"
                        placeholder="Ulangi kata sandi"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-xl bg-bidnavy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-bidnavy2 disabled:opacity-50"
                >
                    {isLoading ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
                </button>

                <p className="text-center text-sm text-gray-600">
                    Sudah memiliki akun?{" "}
                    <Link href="/login" className="font-bold text-bidnavy hover:text-bidnavy2">
                        Masuk di sini
                    </Link>
                </p>
            </form>
        </AuthShell>
    );
}
