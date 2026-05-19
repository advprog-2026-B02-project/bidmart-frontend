"use client";
 
import type { OrderStatus } from "@/types/order";
 
interface Props {
  status: OrderStatus;
}
 
const CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  CREATED: {
    label: "Menunggu Dikemas",
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  },
  PACKAGED: {
    label: "Sudah Dikemas",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  SHIPPED: {
    label: "Dalam Pengiriman",
    className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  },
  COMPLETED: {
    label: "Selesai",
    className: "bg-green-50 text-green-700 border border-green-200",
  },
  DISPUTED: {
    label: "Dalam Sengketa",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
  RESOLVED: {
    label: "Sengketa Selesai",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};
 
export default function OrderStatusBadge({ status }: Props) {
  const { label, className } = CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  };
 
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}