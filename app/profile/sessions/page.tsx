"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface UserSession {
    id: string;
    ipAddress: string;
    userAgent: string;
    isCurrentSession: boolean;
    lastActiveAt: string;
    createdAt: string;
}

export default function SessionManagementPage() {
    const { user, isLoading: authLoading } = useAuth();

    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const res = await fetch("/api/auth/users/me/sessions");
            if (!res.ok) {
                throw new Error("Gagal memuat daftar sesi aktif.");
            }

            const data = await res.json();
            setSessions(data || []);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                fetchSessions();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleRevokeSession = async (sessionId: string) => {
        if (!confirm("Apakah Anda yakin ingin memutuskan koneksi perangkat ini?")) return;

        try {
            setRevokingId(sessionId);
            const res = await fetch(`/api/auth/users/me/sessions/${sessionId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Gagal mencabut izin sesi perangkat.");
            }

            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        } catch (err: unknown) {
            const error = err as Error;
            alert(error.message || "Gagal memproses permintaan.");
        } finally {
            setRevokingId(null);
        }
    };

    const parseUserAgent = (ua: string) => {
        if (ua.includes("Chrome")) return "Google Chrome";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Apple Safari";
        if (ua.includes("Firefox")) return "Mozilla Firefox";
        if (ua.includes("Edge")) return "Microsoft Edge";
        return ua.slice(0, 30) + "...";
    };

    if (authLoading || isLoading) {
        return <div className="text-center py-20 text-sm text-gray-500 animate-pulse">Memuat data sesi perangkat...</div>;
    }

    if (!user) {
        return <div className="text-center py-20 text-sm text-red-500">Silakan login untuk mengelola sesi perangkat Anda.</div>;
    }

    return (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-gray-100 pb-4 mb-6">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Keamanan & Sesi</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Pantau dan kelola daftar perangkat yang saat ini masuk menggunakan akun BidMart Anda.
                </p>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Daftar Sesi Aktif</h3>
                </div>

                <div className="divide-y divide-gray-100">
                    {sessions.map((session) => (
                        <div key={session.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/50 transition-colors">

                            {/* Kiri: Informasi Metadata Sesi Perangkat */}
                            <div className="flex gap-4 items-start">
                                <div className="text-2xl mt-1">
                                    {session.userAgent.includes("Mobi") ? "📱" : "💻"}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-gray-900">
                                            {parseUserAgent(session.userAgent)}
                                        </h4>
                                        {session.isCurrentSession && (
                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                Perangkat Ini
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 space-y-0.5">
                                        <p>Alamat IP: <span className="font-mono text-gray-700">{session.ipAddress}</span></p>
                                        <p>Pertama Login: {new Date(session.createdAt).toLocaleString("id-ID")}</p>
                                        <p>Aktivitas Terakhir: {new Date(session.lastActiveAt).toLocaleString("id-ID")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Kanan: Tombol Aksi Putuskan Sesi */}
                            <div className="sm:self-center">
                                {session.isCurrentSession ? (
                                    <span className="text-xs text-gray-400 font-semibold italic">Sesi Utama Aktif</span>
                                ) : (
                                    <button
                                        onClick={() => handleRevokeSession(session.id)}
                                        disabled={revokingId === session.id}
                                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    >
                                        {revokingId === session.id ? "Memutus..." : "Putuskan Sesi"}
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="text-center py-12 text-xs text-gray-400">Tidak ada data sesi terdeteksi.</div>
                    )}
                </div>
            </div>
        </main>
    );
}