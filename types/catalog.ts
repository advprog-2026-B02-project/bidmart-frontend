export interface CatalogImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  displayOrder: number;
}
 
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}
 

export interface CatalogItem {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string | null;
  status: "ACTIVE";
  currentPrice: number;
  startingPrice: number;
  bidCount: number;
  auctionEndTime: string | null;
  thumbnailUrl: string | null;
}

export type ListingStatus = "DRAFT" | "ACTIVE" | "CLOSED";
 
export interface CatalogPageResponse {
  content: CatalogItem[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  empty: boolean;
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
  images: CatalogImage[];
}
 
export interface Category {
  id: string;
  name: string;
  slug: string | null;
  parentId: string | null;
  children?: Category[];
}
 
export interface CatalogQueryParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  endsBefore?: string;
  page?: number;
  size?: number;
  sort?: string;
}
