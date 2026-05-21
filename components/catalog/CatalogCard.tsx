"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CatalogItem } from "@/types/catalog";
 
interface Props {
  item: CatalogItem;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: (id: string) => void;
}
 
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
 

function useCountdown(auctionEndTime: string | null): string | null {
  const [remaining, setRemaining] = useState<string | null>(null);
 
  useEffect(() => {
    if (!auctionEndTime) return;
 
    let cancelled = false;

    function calculate(): string {
      const diff = new Date(auctionEndTime!).getTime() - Date.now();
      if (diff <= 0) return "Lelang berakhir";

      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      if (days > 0) return `${days}h ${hours}j`;
      if (hours > 0) return `${hours}j ${minutes}m`;
      return `${minutes}m ${seconds}d`;
    }

    function updateCountdown(): void {
      if (cancelled) return;
      setRemaining(calculate());
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [auctionEndTime]);

  return remaining;
}

const PLACEHOLDER_IMAGE = "/images/placeholder-catalog.png";

export default function CatalogCard({ item, canDelete = false, deleting = false, onDelete }: Props) {
  const countdown = useCountdown(item.auctionEndTime);

  const imageUrl = item.thumbnailUrl ?? PLACEHOLDER_IMAGE;
  const hasRealImage = !!item.thumbnailUrl;
 
  return (
    <article className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative h-44 w-full overflow-hidden rounded-t-2xl bg-gray-100">
        <Link href={`/auctions/${item.id}`} className="block h-full w-full">
          {hasRealImage ? (
            <Image
              src={imageUrl}
              alt={item.title}
              width={400}
              height={176}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f6f4ef]">
              <span className="text-4xl text-gray-300">🏷️</span>
            </div>
          )}
        </Link>
 
        {/* Badge kategori */}
        {item.categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm">
            {item.categoryName}
          </span>
        )}
 
        {/* Badge bid count */}
        <span className="absolute right-3 top-3 rounded-full bg-[#002447]/90 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
          {item.bidCount} bid
        </span>
      </div>
 
      {/* Konten card */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/auctions/${item.id}`}
          className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-[#002447]"
        >
          {item.title}
        </Link>
 
        {/* Harga */}
        <div className="mt-auto space-y-1">
          <p className="text-xs text-gray-400">Harga saat ini</p>
          <p className="text-base font-bold text-[#002447]">
            {formatRupiah(item.currentPrice)}
          </p>
          {item.currentPrice !== item.startingPrice && (
            <p className="text-xs text-gray-400 line-through">
              {formatRupiah(item.startingPrice)}
            </p>
          )}
        </div>
 
        {/* Countdown timer */}
        {countdown !== null && (
          <div
            className={`mt-2 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ${
              countdown === "Lelang berakhir"
                ? "bg-gray-100 text-gray-500"
                : "bg-[#002447]/8 text-[#002447]"
            }`}
          >
            <span>{countdown === "Lelang berakhir" ? "🔒" : "⏱️"}</span>
            <span>{countdown}</span>
          </div>
        )}

        {canDelete && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete?.(item.id)}
            className="mt-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Menghapus..." : "Delete dari katalog"}
          </button>
        )}
      </div>
    </article>
  );
}
