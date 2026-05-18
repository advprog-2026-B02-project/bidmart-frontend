export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface ListingImage {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    displayOrder: number;
}

export interface ListingDetail {
    id: string;
    sellerId: string;
    categoryId: string;
    categoryName: string | null;
    categorySlug: string | null;
    title: string;
    description: string | null;
    status: ListingStatus;
    startingPrice: number;
    currentPrice: number;
    minimumIncrement: number;
    bidCount: number;
    createdAt: string;
    activatedAt: string | null;
    auctionEndTime: string | null;
    auctionOngoing: boolean;
    images: ListingImage[];
}

export interface ListingSummary {
    id: string;
    title: string;
    categoryId: string;
    categoryName: string | null;
    status: ListingStatus;
    currentPrice: number;
    startingPrice: number;
    bidCount: number;
    auctionEndTime: string | null;
    thumbnailUrl: string | null;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    children: Category[];
}