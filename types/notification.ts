export type NotificationType =
    | 'BID_PLACED'
    | 'OUTBID'
    | 'AUCTION_WON'
    | 'AUCTION_LOST'
    | 'AUCTION_EXTENDED'
    | 'AUCTION_ENDED'
    | 'ORDER_CREATED'
    | 'ORDER_SHIPPED'
    | 'ORDER_COMPLETED'
    | 'DISPUTE_CREATED'
    | 'DISPUTE_RESOLVED'
    | 'WALLET_UPDATED';

export interface NotificationItem {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: string | null;
    isRead: boolean;
    readAt: string | null;
    relatedAuctionId: string | null;
    relatedOrderId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationPreference {
    userId: string;
    emailBidPlaced: boolean;
    emailOutbid: boolean;
    emailAuctionWon: boolean;
    emailOrderUpdate: boolean;
    pushBidPlaced: boolean;
    pushOutbid: boolean;
    pushAuctionWon: boolean;
    pushOrderUpdate: boolean;
}