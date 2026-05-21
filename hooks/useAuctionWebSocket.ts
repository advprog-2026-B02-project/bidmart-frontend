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
    const onBidPlacedRef = useRef(onBidPlaced);

    useEffect(() => {
        onBidPlacedRef.current = onBidPlaced;
    }, [onBidPlaced]);

    useEffect(() => {
        if (!auctionId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS("/ws-bidding", null, { transports: ["websocket"] }),
            debug: () => { },
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            client.subscribe(`/topic/auctions/${auctionId}`, (message) => {
                if (message.body) {
                    try {
                        const eventData = JSON.parse(message.body);
                        onBidPlacedRef.current(eventData);
                    } catch (error) {
                        console.error("[WebSocket] Gagal parsing payload:", error);
                    }
                }
            });
        };

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [auctionId]);
}