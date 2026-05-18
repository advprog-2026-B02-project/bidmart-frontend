"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import { ListingDetail } from "@/types/catalog";
import { BidResponse, AuctionResponse } from "@/types/bidding";

export default function AuctionDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [listing, setListing] = useState<ListingDetail | null>(null);
    const [auction, setAuction] = useState<AuctionResponse | null>(null);
    const [bidAmount, setBidAmount] = useState<number>(0);
    const [bidHistory, setBidHistory] = useState<Partial<BidResponse>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchAuctionDetail = async () => {
        try {
            setIsLoading(true);

            const res = await fetch(`/api/catalog/listings/${id}`);
            if (!res.ok) throw new Error("Gagal mengambil detail produk.");
            const catalogData: ListingDetail = await res.json();
            setListing(catalogData);

            const auctionRes = await fetch(`/api/bidding/auctions/${id}`);
            if (auctionRes.ok) {
                const auctionData: AuctionResponse = await auctionRes.json();
                setAuction(auctionData);
                setBidAmount(auctionData.minimumNextBid);
            } else {
                setBidAmount(catalogData.currentPrice + catalogData.minimumIncrement);
            }

            const bidRes = await fetch(`/api/bidding/auctions/${id}/bids`);
            if (bidRes.ok) {
                const bidData = await bidRes.json();
                setBidHistory(bidData.content || []);
            }
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Terjadi kesalahan sistem." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAuctionDetail();
        }
    }, [id]);

    useAuctionWebSocket({
        auctionId: id as string,
        onBidPlaced: (eventData) => {
            console.log("[WebSocket] Menerima data bid baru secara real-time:", eventData);

            const incrementValue = listing?.minimumIncrement || 10000;

            setAuction((prev) =>
                prev ? {
                    ...prev,
                    currentPrice: eventData.amount,
                    minimumNextBid: eventData.amount + incrementValue,
                    highestBidderId: eventData.bidderId
                } : null
            );

            setListing((prev) =>
                prev ? {
                    ...prev,
                    currentPrice: eventData.amount,
                    bidCount: prev.bidCount + 1
                } : null
            );

            setBidAmount(eventData.amount + incrementValue);

            const newBidRecord: Partial<BidResponse> = {
                id: eventData.id,
                auctionId: eventData.auctionId,
                bidderId: eventData.bidderId,
                amount: eventData.amount,
                createdAt: eventData.createdAt || new Date().toISOString(),
                status: eventData.status,
                holdId: eventData.holdId
            };

            setBidHistory((prev) => [newBidRecord, ...prev]);
        }
    });

    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            router.push("/login");
            return;
        }

        const minBidRequired = auction ? auction.minimumNextBid : (listing ? listing.currentPrice + listing.minimumIncrement : 0);

        if (bidAmount < minBidRequired) {
            setMessage({
                type: "error",
                text: `Nominal bid minimal harus ${formatPrice(minBidRequired)}`
            });
            return;
        }

        try {
            setIsSubmitting(true);
            setMessage(null);

            const res = await fetch(`/api/bidding/auctions/${id}/bids`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: bidAmount }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Gagal mengajukan penawaran.");
            }

            setMessage({ type: "success", text: "Penawaran Anda berhasil ditempatkan!" });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Terjadi kesalahan." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (isLoading) {
        return <div className="text-center py-20 text-sm text-gray-500 animate-pulse">Memuat ruang lelang...</div>;
    }

    if (!listing) {
        return <div className="text-center py-20 text-sm text-red-500">Barang lelang tidak ditemukan.</div>;
    }

    const currentAuctionStatus = auction ? auction.status : listing.status;

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">

                {/* SISI KIRI: Foto & Deskripsi */}
                <div className="space-y-6">
                    <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
                        {listing.images && listing.images.length > 0 ? (
                            <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover object-center" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">Tidak ada gambar</div>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-base font-bold text-gray-900 mb-2">Deskripsi Barang</h2>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
                    </div>
                </div>

                {/* SISI KANAN: Panel Utama Taruhan */}
                <div className="flex flex-col justify-between space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div>
                            {listing.categoryName && <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">{listing.categoryName}</span>}
                            <h1 className="text-2xl font-black text-gray-900 mt-1">{listing.title}</h1>
                            <p className="text-xs text-gray-400 mt-1">ID Lelang: {listing.id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <p className="text-[11px] font-medium text-gray-400 uppercase">Harga Sekarang</p>
                                <p className="text-2xl font-black text-gray-900">{formatPrice(auction ? auction.currentPrice : listing.currentPrice)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-gray-400 uppercase">Total Penawaran</p>
                                <p className="text-2xl font-black text-emerald-600">{listing.bidCount} Bid</p>
                            </div>
                        </div>

                        {message && (
                            <div className={`rounded-lg p-4 text-sm font-medium border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                                {message.text}
                            </div>
                        )}

                        {currentAuctionStatus === "ACTIVE" || currentAuctionStatus === "EXTENDED" ? (
                            <form onSubmit={handlePlaceBid} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Masukkan Nominal Penawaran</label>
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">Rp</span>
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            disabled={isSubmitting}
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(Number(e.target.value))}
                                            step={listing.minimumIncrement}
                                            className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-3 text-base text-gray-900 font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs text-gray-400">
                                        Minimal penawaran berikutnya: <span className="font-semibold text-gray-700">{formatPrice(auction ? auction.minimumNextBid : listing.currentPrice + listing.minimumIncrement)}</span>
                                    </p>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                                    {isSubmitting ? "Menempatkan Bid..." : user ? "Ajukan Penawaran Sekarang" : "Masuk untuk Mengajukan Bid"}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-gray-100 text-center py-4 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200">
                                Lelang Sudah Ditutup (Status: {currentAuctionStatus})
                            </div>
                        )}
                    </div>

                    {/* Tabel Riwayat Aktivitas Penawaran */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Aktivitas Penawaran Terakhir</h3>
                        {bidHistory.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">Belum ada aktivitas penawaran pada barang ini.</p>
                        ) : (
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                {bidHistory.map((bid, index) => (
                                    <div key={bid.id || index} className="flex justify-between items-center text-xs p-2 rounded-lg bg-gray-50 border border-gray-100">
                                        <span className="font-medium text-gray-600">User ID: ...{bid.bidderId?.slice(-6) || "Anonim"}</span>
                                        <span className="font-black text-gray-900">{bid.amount ? formatPrice(bid.amount) : ""}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
}