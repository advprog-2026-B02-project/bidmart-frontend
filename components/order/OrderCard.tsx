"use client";

import Link from "next/link";
import type { OrderSummary, OrderRole, OrderStatus } from "@/types/order";
import { toDate } from "@/lib/utils/dateTime";

interface Props {
  order: OrderSummary;
  viewAs: OrderRole;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  const date = toDate(iso);
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; icon: string }
> = {
  CREATED:   { label: "Dibuat",        className: "bg-blue-100 text-blue-700 border-blue-200",      icon: "📋" },
  PACKAGED:  { label: "Dikemas",       className: "bg-orange-100 text-orange-700 border-orange-200", icon: "📦" },
  SHIPPED:   { label: "Dikirim",       className: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "🚚" },
  PACKAGED: { label: "Dikemas",       className: "bg-amber-100 text-amber-700 border-amber-200",    icon: "📦" },
  COMPLETED: { label: "Selesai",       className: "bg-green-100 text-green-700 border-green-200",    icon: "✅" },
  DISPUTED:  { label: "Sengketa",      className: "bg-red-100 text-red-700 border-red-200",          icon: "⚠️" },
  RESOLVED:  { label: "Diselesaikan",  className: "bg-gray-100 text-gray-600 border-gray-200",       icon: "🔒" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className, icon } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

export default function OrderCard({ order, viewAs }: Props) {
  // Nama lawan transaksi: jika buyer → tampilkan seller, jika seller → tampilkan buyer
  const counterpartyLabel = viewAs === "BUYER" ? "Penjual" : "Pembeli";
  const counterpartyName =
    viewAs === "BUYER"
      ? (order.seller?.displayName ?? "—")
      : (order.buyer?.displayName ?? "—");

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-50 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-400">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">
            {order.listingTitle}
          </h3>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Body */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-400">{counterpartyLabel}</p>
          <p className="mt-0.5 font-medium text-gray-800 truncate">
            {counterpartyName}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total</p>
          <p className="mt-0.5 font-semibold text-[#002447]">
            {formatRupiah(order.amount)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-2">
          <p className="text-xs text-gray-400">Tanggal Pesanan</p>
          <p className="mt-0.5 text-gray-600">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Footer CTA hint */}
      <div className="border-t border-gray-50 px-5 py-3">
        <p className="text-xs text-[#002447] font-medium">
          Lihat Detail →
        </p>
      </div>
    </Link>
  );
}
