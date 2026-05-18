"use client";

import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { BidResponse } from "@/types/bidding";

interface WebSocketArgs {
    auctionId: string;
    onBidPlaced: (eventData: BidResponse & { bidCount: number }) => void;
}

export function useAuctionWebSocket({ auctionId, onBidPlaced }: WebSocketArgs) {
    const stompClientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!auctionId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS("/api/bidding/ws-auction"),
            debug: () => { },
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            console.log(`[WebSocket] Sukses terhubung ke ruang lelang: ${auctionId}`);

            client.subscribe(`/topic/auctions/${auctionId}`, (message) => {
                if (message.body) {
                    try {
                        const eventData = JSON.parse(message.body);
                        onBidPlaced(eventData);
                    } catch (error) {
                        console.error("[WebSocket] Gagal parsing payload:", error);
                    }
                }
            });
        };

        client.onStompError = (frame) => {
            console.error("[WebSocket] STOMP Error:", frame.headers["message"]);
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                console.log(`[WebSocket] Memutuskan koneksi ruang lelang: ${auctionId}`);
            }
        };
    }, [auctionId]);

    return stompClientRef.current;
}