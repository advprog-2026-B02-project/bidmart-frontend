"use client";

import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { BidResponse } from "@/types/bidding";

interface WebSocketArgs {
    auctionId: string;
    onBidPlaced: (eventData: BidResponse & { bidCount: number }) => void;
}

export function useAuctionWebSocket({ auctionId, onBidPlaced }: WebSocketArgs) {
    const [stompClient, setStompClient] = useState<Client | null>(null);

    useEffect(() => {
        if (!auctionId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS("/api/bidding/ws-auction"),
            debug: () => { },
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
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

        client.activate();

        const timer = setTimeout(() => {
            setStompClient(client);
        }, 0);

        return () => {
            clearTimeout(timer);
            client.deactivate();
            setStompClient(null);
        };
    }, [auctionId, onBidPlaced]);

    return stompClient;
}