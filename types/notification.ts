export type NotificationType =
    | "BID_PLACED"
    | "OUTBID"
    | "AUCTION_WON"
    | "AUCTION_LOST"
    | "AUCTION_EXTENDED"
    | "AUCTION_ENDED"
    | "ORDER_CREATED"
    | "ORDER_PACKAGED"
    | "ORDER_SHIPPED"
    | "ORDER_COMPLETED"
    | "DISPUTE_CREATED"
    | "DISPUTE_RESOLVED"
    | "WALLET_UPDATED";

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    read: boolean;
    createdAt: string;
}

export interface NotificationListResponse {
    content: NotificationItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    unreadCount: number;
}

// Preference Types 

export interface NotificationChannelPreference {
    bidPlaced: boolean;
    outbid: boolean;
    auctionWon: boolean;
    orderUpdate: boolean;
}

export interface NotificationPreferenceResponse {
    email: NotificationChannelPreference;
    push: NotificationChannelPreference;
}

export interface UpdateNotificationPreferenceRequest {
    email?: Partial<NotificationChannelPreference>;
    push?: Partial<NotificationChannelPreference>;
}
