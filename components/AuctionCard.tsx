"use client";

import React from "react";
import Link from "next/link";
import { ListingSummary } from "@/types/catalog";

interface AuctionCardProps {
    listing: ListingSummary;
}

export default function AuctionCard({ listing }: AuctionCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatRemainingTime = (endTimeString: string | null) => {
        if (!endTimeString) return "Waktu tidak ditentukan";

        const now = new Date();
        const end = new Date(endTimeString);
        const diffMs = end.getTime() - now.getTime();

        if (diffMs <= 0) return "Lelang Selesai";

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} hari lagi`;
        if (diffHours > 0) return `${diffHours} jam lagi`;
        return `${diffMins % 60} menit lagi`;
    };

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            {/* Container Gambar / Thumbnail */}
            <div className="aspect-square w-full bg-gray-50 overflow-hidden relative">
                {listing.thumbnailUrl ? (
                    <img
                        src={listing.thumbnailUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-medium text-gray-400">
                        Tidak ada gambar
                    </div>
                )}

                {/* Badge Sisa Waktu di Pojok Kiri Atas */}
                <div className="absolute top-3 left-3 rounded-md bg-black/70 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold text-white tracking-wide">
                    {formatRemainingTime(listing.auctionEndTime)}
                </div>
            </div>

            {/* Konten Informasi Produk */}
            <div className="flex flex-1 flex-col p-4">
                {listing.categoryName && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                        {listing.categoryName}
                    </span>
                )}

                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[40px] mb-2 group-hover:text-emerald-600 transition-colors">
                    <Link href={`/auctions/${listing.id}`}>
                        <span className="absolute inset-0" aria-hidden="true" />
                        {listing.title}
                    </Link>
                </h3>

                {/* Garis Pembatas Halus */}
                <div className="my-2 border-t border-gray-50" />

                {/* Informasi Finansial (Harga dan Jumlah Bid) */}
                <div className="mt-auto flex items-end justify-between">
                    <div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Tawaran Tertinggi</p>
                        <p className="text-base font-black text-gray-900">{formatPrice(listing.currentPrice)}</p>
                    </div>

                    <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-100">
                            {listing.bidCount} Bid
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}