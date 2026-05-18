"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NotificationItem } from "@/types/notification";

export default function NotificationsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                const items: NotificationItem[] = data.content || data || [];
                setNotifications(items);

                const unread = items.filter((n) => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error("Gagal memuat notifikasi:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                fetchNotifications();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: "PUT",
            });

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Gagal memperbarui status notifikasi:", err);
        }
    };

    const handleReadAll = async () => {
        try {
            const res = await fetch("/api/notifications/read-all", {
                method: "PUT",
            });

            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("Gagal memperbarui semua notifikasi:", err);
        }
    };

    const handleNotificationClick = (item: NotificationItem) => {
        if (!item.isRead) {
            handleMarkAsRead(item.id);
        }

        if (item.relatedAuctionId) {
            router.push(`/auctions/${item.relatedAuctionId}`);
        } else if (item.relatedOrderId) {
            router.push(`/orders/${item.relatedOrderId}`);
        }
    };

    if (authLoading || isLoading) {
        return <div className="text-center py-20 text-sm text-gray-500 animate-pulse">Memuat kotak masuk notifikasi...</div>;
    }

    if (!user) {
        return <div className="text-center py-20 text-sm text-red-500">Silakan login untuk melihat notifikasi Anda.</div>;
    }

    return (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="sm:flex sm:items-center sm:justify-between border-b border-gray-100 pb-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl flex items-center gap-3">
                        Notifikasi
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                                {unreadCount} Baru
                            </span>
                        )}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Pantau aktivitas penawaran lelang dan status pesanan Anda secara real-time.</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleReadAll}
                        className="mt-4 sm:mt-0 text-xs font-bold text-bidnavy hover:text-bidnavy2 transition-colors"
                    >
                        Tandai Semua Telah Dibaca
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-400">
                    Belum ada notifikasi yang masuk ke akun Anda.
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${item.isRead
                                ? "bg-white border-gray-100 opacity-75 hover:bg-bidcream/70"
                                : "bg-bidnavy/10 border-bidnavy/15 hover:bg-bidnavy/15 shadow-sm"
                                }`}
                        >
                            {/* Indikator unread bulatan hijau */}
                            <div className="flex items-start pt-1">
                                <span className={`h-2.5 w-2.5 rounded-full ${item.isRead ? "bg-transparent" : "bg-bidnavy"}`} />
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start gap-4">
                                    <h4 className={`text-sm ${item.isRead ? "font-semibold text-gray-700" : "font-bold text-gray-900"}`}>
                                        {item.title}
                                    </h4>
                                    <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                                        {item.type.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">{item.message}</p>
                                <p className="text-[10px] text-gray-400 pt-1">
                                    {new Date(item.createdAt).toLocaleDateString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
