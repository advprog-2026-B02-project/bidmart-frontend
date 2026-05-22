"use client";

import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { BidResponse } from "@/types/bidding";

type AuctionBidEvent = Partial<BidResponse> & {
    auctionId?: string;
    listingId?: string;
    bidderId: string;
    amount: number;
    minimumNextBid?: number;
    bidCount?: number;
    auctionEndTime?: string;
};

type AuctionEndedEvent = {
    status?: string;
    winningBid?: number;
    winnerName?: string;
};

interface WebSocketArgs {
    auctionId: string;
    onBidPlaced: (eventData: AuctionBidEvent) => void;
    onAuctionEnded?: (eventData: AuctionEndedEvent) => void;
}

export function useAuctionWebSocket({ auctionId, onBidPlaced, onAuctionEnded }: WebSocketArgs) {
    const onBidPlacedRef = useRef(onBidPlaced);
    const onAuctionEndedRef = useRef(onAuctionEnded);

    useEffect(() => {
        onBidPlacedRef.current = onBidPlaced;
    }, [onBidPlaced]);

    useEffect(() => {
        onAuctionEndedRef.current = onAuctionEnded;
    }, [onAuctionEnded]);

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
                        const payload = JSON.parse(message.body);
                        if (payload?.type === "AUCTION_ENDED") {
                            onAuctionEndedRef.current?.(payload.data ?? payload);
                            return;
                        }

                        const eventData = payload?.type === "NEW_BID" ? payload.data : payload;

                        if (eventData?.amount !== undefined) {
                            onBidPlacedRef.current(eventData);
                        }
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
