export type OrderStatus =
  | "CREATED"
  | "PACKAGED"
  | "SHIPPED"
  | "COMPLETED"
  | "DISPUTED"
  | "RESOLVED";
 
export type OrderRole = "BUYER" | "SELLER";

export interface OrderParticipant {
  id: string;
  displayName: string;
}
 
export interface ShippingAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}
 
export interface BuyerDetail extends OrderParticipant {
  shippingAddress: ShippingAddress | null;
}
 
export interface ListingSnapshot {
  id: string;
  title: string;
  images: string[];
}
 

export interface ShippingInfo {
  courier: string;
  trackingNumber: string;
  shippedAt: string | null;
}
 
export interface TimelineEvent {
  status: OrderStatus;
  occurredAt: string;
  note: string | null;
}

export interface OrderSummary {
  id: string;
  auctionId: string;
  listingTitle: string;
  amount: number;
  buyer: OrderParticipant;
  seller: OrderParticipant;
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

export interface OrderDetail {
  id: string;
  auctionId: string;
  listing: ListingSnapshot;
  amount: number;
  buyer: BuyerDetail;
  seller: OrderParticipant;
  status: OrderStatus;
  shipping: ShippingInfo | null;
  timeline: TimelineEvent[] | null;
  createdAt: string;
}
 
export interface ShipOrderRequest {
  courier: string;
  trackingNumber: string;
  status?: string;
}
 
export interface DisputeOrderRequest {
  reason: string;
  description: string;
  evidenceImages: string[];
}
 

export interface OrderErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}