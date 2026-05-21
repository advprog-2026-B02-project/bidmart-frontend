"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
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
            setLoading(true);
            setMsg(null);
            setIsError(false);

            try {
                const data = await listActiveSessions();
                if (!cancelled) {
                    setSessions(data);
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
        <main className="min-h-screen bg-bidcream px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bidnavy/60">Security</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight text-bidnavy sm:text-4xl">
                            Sesi Aktif
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">Lihat dan cabut perangkat yang sedang terhubung.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/me")}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-bidnavy shadow-sm hover:bg-bidcream"
                    >
                        Kembali ke Profil
                    </button>
                </section>

                <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    {loading ? (
                        <div className="py-8 text-center text-sm font-semibold text-gray-500">Memuat sesi...</div>
                    ) : sessions.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-bidcream px-4 py-4 text-sm text-gray-600">
                            Tidak ada sesi aktif.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="rounded-xl border border-gray-200 bg-bidcream/60 px-4 py-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-bold text-bidnavy">
                                                    {session.device || "Unknown device"}
                                                </p>
                                                {session.current && (
                                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                                                        Saat ini
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                IP {session.ipAddress || "-"} · Terakhir aktif {formatDate(session.lastActive)}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={session.current || actionId === session.id}
                                            onClick={() => onRevoke(session.id)}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
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
                            className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${
                                isError ? "border-red-100 bg-red-50 text-red-600" : "border-green-100 bg-green-50 text-green-700"
                            }`}
                        >
                            {msg}
                        </div>
                    )}

                    <button
                        type="button"
                        disabled={loading}
                        onClick={loadSessions}
                        className="mt-5 rounded-lg bg-bidnavy px-5 py-3 text-sm font-bold text-white hover:bg-bidnavy2 disabled:opacity-60"
                    >
                        Muat Ulang
                    </button>
                </section>
            </div>
        </main>
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
