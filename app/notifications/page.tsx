"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getNotifications,
    markAllAsRead,
    markAsRead,
} from "@/lib/notification.api";
import type { NotificationItem, NotificationListResponse } from "@/types/notification";

// ─── Notification type metadata 
const TYPE_META: Record<string, { icon: string; accent: string }> = {
    BID_PLACED:       { icon: "🔨", accent: "bg-blue-50 border-blue-200" },
    OUTBID:           { icon: "⚡", accent: "bg-amber-50 border-amber-200" },
    AUCTION_WON:      { icon: "🏆", accent: "bg-emerald-50 border-emerald-200" },
    AUCTION_LOST:     { icon: "😞", accent: "bg-slate-50 border-slate-200" },
    AUCTION_EXTENDED: { icon: "⏳", accent: "bg-violet-50 border-violet-200" },
    AUCTION_ENDED:    { icon: "🔔", accent: "bg-slate-50 border-slate-200" },
    ORDER_CREATED:    { icon: "📦", accent: "bg-sky-50 border-sky-200" },
    ORDER_SHIPPED:    { icon: "🚚", accent: "bg-sky-50 border-sky-200" },
    ORDER_COMPLETED:  { icon: "✅", accent: "bg-emerald-50 border-emerald-200" },
    DISPUTE_CREATED:  { icon: "⚠️", accent: "bg-rose-50 border-rose-200" },
    DISPUTE_RESOLVED: { icon: "🤝", accent: "bg-green-50 border-green-200" },
    WALLET_UPDATED:   { icon: "💰", accent: "bg-yellow-50 border-yellow-200" },
};

function getTypeMeta(type: string) {
    return TYPE_META[type] ?? { icon: "🔔", accent: "bg-slate-50 border-slate-200" };
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Skeleton loader 
function SkeletonRow() {
    return (
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 w-2/5 bg-slate-200 rounded" />
                <div className="h-3 w-3/4 bg-slate-100 rounded" />
                <div className="h-2.5 w-1/5 bg-slate-100 rounded" />
            </div>
        </div>
    );
}

// ─── Empty state 
function EmptyState({ filtered }: { filtered: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <span className="text-5xl mb-4">{filtered ? "🔍" : "🔕"}</span>
            <p className="font-semibold text-slate-600 text-sm">
                {filtered ? "Tidak ada notifikasi belum dibaca" : "Belum ada notifikasi"}
            </p>
            <p className="text-xs mt-1">
                {filtered ? "Kamu sudah membaca semua notifikasi." : "Notifikasi akan muncul di sini."}
            </p>
        </div>
    );
}

// ─── Notification row 
interface NotificationRowProps {
    item: NotificationItem;
    onRead: (id: string) => void;
}

function NotificationRow({ item, onRead }: NotificationRowProps) {
    const { icon, accent } = getTypeMeta(item.type);

    const handleClick = () => {
        if (!item.read) onRead(item.id);
    };

    return (
        <button
            onClick={handleClick}
            className={`w-full text-left flex items-start gap-3 px-5 py-4 border-b border-slate-100 transition-colors duration-150
                ${item.read
                    ? "bg-white hover:bg-slate-50"
                    : "bg-bidcream/40 hover:bg-bidcream/60"
                }`}
        >
            {/* Icon */}
            <div className={`h-10 w-10 rounded-full border flex items-center justify-center text-base shrink-0 ${accent}`}>
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug truncate ${item.read ? "font-normal text-slate-700" : "font-semibold text-slate-900"}`}>
                        {item.title}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">
                        {formatRelativeTime(item.createdAt)}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.message}
                </p>
            </div>

            {/* Unread dot */}
            {!item.read && (
                <div className="h-2 w-2 rounded-full bg-bidnavy shrink-0 mt-2" />
            )}
        </button>
    );
}

// ─── Filter tab 
type FilterState = "all" | "unread";

// ─── Main page 
export default function NotificationsPage() {
    const { user } = useAuth();

    const [data, setData] = useState<NotificationListResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [filter, setFilter] = useState<FilterState>("all");
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(
        async (currentFilter: FilterState) => {
            let isCancelled = false;
            setIsLoading(true);
            setError(null);

            try {
                const readParam = currentFilter === "unread" ? false : undefined;
                const result = await getNotifications(readParam, 0, 50);
                if (!isCancelled) setData(result);
            } catch (err) {
                if (!isCancelled) setError("Gagal memuat notifikasi. Silakan coba lagi.");
                console.error(err);
            } finally {
                if (!isCancelled) setIsLoading(false);
            }

            return () => { isCancelled = true; };
        },
        []
    );

    useEffect(() => {
        let isCancelled = false;
        if (!user) return;

        setIsLoading(true);
        setError(null);
        const readParam = filter === "unread" ? false : undefined;

        getNotifications(readParam, 0, 50)
            .then((result) => { if (!isCancelled) { setData(result); setIsLoading(false); } })
            .catch((err) => {
                if (!isCancelled) { setError("Gagal memuat notifikasi."); setIsLoading(false); }
                console.error(err);
            });

        return () => { isCancelled = true; };
    }, [user, filter]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id);
            setData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    unreadCount: Math.max(0, prev.unreadCount - 1),
                    content: prev.content.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                };
            });
        } catch (err) {
            console.error("Gagal tandai notifikasi:", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsMarkingAll(true);
        try {
            await markAllAsRead();
            setData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    unreadCount: 0,
                    content: prev.content.map((n) => ({ ...n, read: true })),
                };
            });
        } catch (err) {
            console.error("Gagal tandai semua notifikasi:", err);
        } finally {
            setIsMarkingAll(false);
        }
    };

    const hasUnread = (data?.unreadCount ?? 0) > 0;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-2xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifikasi</h1>
                        {data && data.unreadCount > 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">
                                {data.unreadCount} belum dibaca
                            </p>
                        )}
                    </div>
                    {hasUnread && (
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={isMarkingAll}
                            className="text-xs font-semibold text-bidnavy border border-bidnavy/30 rounded-md px-3 py-1.5
                                hover:bg-bidnavy hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isMarkingAll ? "Memproses..." : "Tandai Semua Dibaca"}
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 mb-4 w-fit">
                    {(["all", "unread"] as FilterState[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors
                                ${filter === f
                                    ? "bg-bidnavy text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {f === "all" ? "Semua" : "Belum Dibaca"}
                        </button>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {error && (
                        <div className="px-5 py-4 text-sm text-rose-600 bg-rose-50 border-b border-rose-100">
                            {error}
                            <button
                                onClick={() => fetchData(filter)}
                                className="ml-2 underline font-semibold"
                            >
                                Coba lagi
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : !data || data.content.length === 0 ? (
                        <EmptyState filtered={filter === "unread"} />
                    ) : (
                        data.content.map((item) => (
                            <NotificationRow key={item.id} item={item} onRead={handleMarkAsRead} />
                        ))
                    )}
                </div>

                {/* Pagination info */}
                {data && data.totalElements > 0 && (
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Menampilkan {data.content.length} dari {data.totalElements} notifikasi
                    </p>
                )}
            </div>
        </div>
    );
}