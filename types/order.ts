export type OrderStatus = 'CREATED' | 'PACKAGED' | 'SHIPPED' | 'COMPLETED' | 'DISPUTED' | 'RESOLVED';
export type DisputeResolution = 'REFUND_BUYER' | 'RELEASE_TO_SELLER';

export interface Order {
    id: string;
    auctionId: string;
    listingId: string;
    listingTitle: string;
    listingImageUrl: string | null;
    buyerId: string;
    buyerDisplayName: string;
    shippingStreet: string | null;
    shippingCity: string | null;
    shippingProvince: string | null;
    shippingPostalCode: string | null;
    courier: string | null;
    trackingNumber: string | null;
    shippedAt: string | null;
    sellerId: string;
    sellerDisplayName: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;

    disputeReason: string | null;
    disputeDescription: string | null;
    disputedAt: string | null;
    disputeResolution: DisputeResolution | null;
    disputeNote: string | null;
    resolvedAt: string | null;
    evidenceImages: string | null;
}

export interface OrderResponse {
    content: Order[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}