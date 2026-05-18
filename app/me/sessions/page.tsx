"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import AuthShell from "@/components/AuthShell";
import {ActiveSession, listActiveSessions, revokeSession} from "@/lib/api";

export default function SessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    async function loadSessions() {
        setLoading(true);
        setMsg(null);
        setIsError(false);

        try {
            setSessions(await listActiveSessions());
        } catch (err: unknown) {
            setIsError(true);
            setMsg(err instanceof Error ? err.message : "Gagal memuat sesi aktif.");
        } finally {
            setLoading(false);
        }
    }

    async function onRevoke(sessionId: string) {
        setActionId(sessionId);
        setMsg(null);
        setIsError(false);

        try {
            await revokeSession(sessionId);
            setSessions((current) => current.filter((session) => session.id !== sessionId));
            setMsg("Sesi berhasil dicabut.");
        } catch (err: unknown) {
            setIsError(true);
            setMsg(err instanceof Error ? err.message : "Gagal mencabut sesi.");
        } finally {
            setActionId(null);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function loadInitialSessions() {
            try {
                const data = await listActiveSessions();
                if (!cancelled) {
                    setSessions(data);
                    setMsg(null);
                    setIsError(false);
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    setIsError(true);
                    setMsg(err instanceof Error ? err.message : "Gagal memuat sesi aktif.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadInitialSessions();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <AuthShell title="Sesi Aktif" subtitle="Lihat dan cabut perangkat yang sedang terhubung.">
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-sm font-medium text-black/50 py-4">Memuat sesi...</div>
                ) : sessions.length === 0 ? (
                    <div className="rounded-xl bg-[#002447]/5 border border-[#002447]/10 px-4 py-4 text-sm text-black/60">
                        Tidak ada sesi aktif.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="rounded-xl bg-[#002447]/5 border border-[#002447]/10 px-4 py-4"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-[#002447] truncate">
                                                {session.device || "Unknown device"}
                                            </p>
                                            {session.current && (
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                                    Saat ini
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-black/50">
                                            IP {session.ipAddress || "-"} · Terakhir aktif {formatDate(session.lastActive)}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={session.current || actionId === session.id}
                                        onClick={() => onRevoke(session.id)}
                                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-black/20 disabled:text-black/40"
                                    >
                                        {actionId === session.id ? "Mencabut..." : "Cabut"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {msg && (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm ${
                            isError ? "bg-red-50 border-red-100 text-red-600" : "bg-green-50 border-green-100 text-green-700"
                        }`}
                    >
                        {msg}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={loadSessions}
                        className="w-full rounded-xl py-3 text-sm font-semibold text-[#002447] bg-[#002447]/10 hover:bg-[#002447]/20 disabled:opacity-60"
                    >
                        Muat Ulang
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/me")}
                        className="w-full rounded-xl py-3 text-sm font-semibold text-[#002447] bg-[#002447]/10 hover:bg-[#002447]/20"
                    >
                        Kembali ke Profil
                    </button>
                </div>
            </div>
        </AuthShell>
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}
