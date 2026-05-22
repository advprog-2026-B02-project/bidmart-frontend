export interface UserBasicDTO {
  id: string;
  displayName: string;
}

export type OrderStatus =
  | "CREATED"
  | "PACKAGED"
  | "SHIPPED"
  | "COMPLETED"
  | "DISPUTED"
  | "RESOLVED";

export interface OrderSummary {
  id: string;
  auctionId: string;
  listingTitle: string;
  amount: number;
  buyer: UserBasicDTO;
  seller: UserBasicDTO;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderListResponse {
  content: OrderSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type OrderRole = "BUYER" | "SELLER";

export interface OrderListParams {
  role: OrderRole;
  status?: OrderStatus;
  page?: number;
  size?: number;
}

export interface ShippingAddress {
  street: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
}

export interface BuyerDTO {
  id: string;
  displayName: string;
  shippingAddress: ShippingAddress;
}

export interface SellerDTO {
  id: string;
  displayName: string;
}

export interface ListingDTO {
  id: string;
  title: string;
  images: string[];
}

export interface ShippingDTO {
  courier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
}

export interface TimelineDTO {
  status: string;
  timestamp: string;
}

export interface OrderDetail {
  id: string;
  auctionId: string;
  listing: ListingDTO;
  amount: number;
  buyer: BuyerDTO;
  seller: SellerDTO;
  status: OrderStatus;
  shipping: ShippingDTO | null;
  timeline: TimelineDTO[] | null;
  createdAt: string;
}

export interface ShipOrderPayload {
  status: "PACKAGED" | "SHIPPED";
  courier?: string;
  trackingNumber?: string;
}

export interface DisputePayload {
  reason: string;
  description: string;
  evidenceImages: string[];
}
