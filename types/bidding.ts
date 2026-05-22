export type BidStatus = 'ACCEPTED' | 'OUTBID' | 'REJECTED';
export type AuctionStatus = 'DRAFT' | 'ACTIVE' | 'EXTENDED' | 'CLOSED' | 'WON' | 'UNSOLD';

export interface BidResponse {
    id: string;
    auctionId: string;
    bidderId: string;
    bidderDisplay?: string; // censored email or display name
    amount: number;
    status: BidStatus;
    holdId: string | null;
    previousHighBid: number;
    newHighBid: boolean;
    auctionEndTime: string;
    createdAt: string;
}

export interface AuctionResponse {
    id: string;
    listingId: string;
    status: AuctionStatus;
    currentPrice: number;
    minimumNextBid: number;
    highestBidderId: string | null;
    highestBidderMaxAmount?: number;
    startTime: string;
    endTime: string;
    originalEndTime: string;
    extensionCount: number;
    reserveMet: boolean;
}