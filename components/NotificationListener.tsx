"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { NotificationItem } from "@/types/notification";

export default function NotificationListener() {
    const { user } = useAuth();
    const [activeToast, setActiveToast] = useState<Partial<NotificationItem> | null>(null);

    useEffect(() => {
        if (!user) return;

        const notificationWsUrl =
            process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL ??
            "http://localhost:8086/api/notifications/ws/notifications";
            
        const client = new Client({
            webSocketFactory: () => new SockJS(notificationWsUrl),

            connectHeaders: {
                "X-User-Id": user.id,
            },

            debug: () => { },
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            console.log(`[Notification-WS] Sukses tersambung untuk User: ${user.displayName}`);

            client.subscribe("/user/queue/notifications", (message) => {
                if (message.body) {
                    try {
                        const notificationData: NotificationItem = JSON.parse(message.body);

                        setActiveToast(notificationData);

                        setTimeout(() => {
                            setActiveToast(null);
                        }, 5000);
                    } catch (error) {
                        console.error("[Notification-WS] Gagal membaca payload:", error);
                    }
                }
            });
        };

        client.onStompError = (frame) => {
            console.error("[Notification-WS] Error koneksi STOMP:", frame.headers["message"]);
        };

        client.activate();

        return () => {
            client.deactivate();
            console.log("[Notification-WS] Memutuskan koneksi websocket global.");
        };
    }, [user]);

    if (!activeToast) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-xl border border-bidnavy/15 p-4 animate-slide-in transition-all">
            <div className="flex items-start gap-3">
                {/* Bulatan Icon Indikator */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bidnavy/15 text-bidnavy font-bold text-sm animate-pulse">
                    🔔
                </div>

                {/* Isi Informasi Notifikasi Singkat */}
                <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-black text-gray-900 truncate">
                            {activeToast.title || "Notifikasi Baru"}
                        </h5>
                        <button
                            onClick={() => setActiveToast(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1"
                        >
                            &times;
                        </button>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug">
                        {activeToast.message}
                    </p>
                </div>
            </div>
        </div>
    );
}