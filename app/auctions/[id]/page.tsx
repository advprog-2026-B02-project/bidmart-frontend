"use client";
import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import { fetchListingDetail } from "@/lib/catalog.api";
import { maskBidderDisplay } from "@/lib/utils/mask";
import type { ListingDetail } from "@/types/catalog";
import type { AuctionResponse, BidResponse } from "@/types/bidding";
import ListingGallery from "@/components/catalog/ListingGallery";
import AuctionCountdown from "@/components/catalog/AuctionCountdown";

interface PageProps {
  params: Promise<{ id: string }>;
}

type BidMessage = { type: "success" | "error"; text: string } | null;
type BidPagePayload = { content?: Partial<BidResponse>[]; totalElements?: number };

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function normalizeBidPage(data: unknown): { bids: Partial<BidResponse>[]; total: number } {
  if (Array.isArray(data)) {
    return { bids: data as Partial<BidResponse>[], total: data.length };
  }

  const page = data as BidPagePayload;
  const bids = Array.isArray(page?.content) ? page.content : [];
  return {
    bids,
    total: typeof page?.totalElements === "number" ? page.totalElements : bids.length,
  };
}

function isOpenAuctionStatus(status: AuctionResponse["status"] | ListingDetail["status"]): boolean {
  return status === "ACTIVE" || status === "EXTENDED";
}

function isClosedAuctionStatus(status: AuctionResponse["status"] | ListingDetail["status"]): boolean {
  return status === "CLOSED" || status === "WON" || status === "UNSOLD";
}

function toListingStatus(
  auctionStatus: AuctionResponse["status"],
  fallback: ListingDetail["status"]
): ListingDetail["status"] {
  if (isClosedAuctionStatus(auctionStatus)) return "CLOSED";
  if (isOpenAuctionStatus(auctionStatus)) return "ACTIVE";
  return fallback;
}

function StatusBadge({ status }: { status: ListingDetail["status"] }) {
  const map: Record<ListingDetail["status"], { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    ACTIVE: { label: "Aktif", className: "bg-green-100 text-green-700 border-green-200" },
    CLOSED: { label: "Ditutup", className: "bg-gray-100 text-gray-500 border-gray-200" },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-50 py-2.5 last:border-none">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Galeri skeleton */}
        <div className="lg:col-span-3">
          <div className="h-80 w-full animate-pulse rounded-2xl bg-gray-200 sm:h-96" />
          <div className="mt-3 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-16 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
        {/* Info skeleton */}
        <div className="space-y-4 lg:col-span-2">
          <div className="h-6 w-3/4 animate-pulse rounded-full bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-200" />
          <div className="h-16 w-full animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-32 w-full animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function BidCard({
  listing,
  auction,
  bidCount,
  bidAmount,
  bidMessage,
  isSubmitting,
  now,
  onBidAmountChange,
  onSubmit,
  onCountdownExpire,
  user,
}: {
  listing: ListingDetail;
  auction: AuctionResponse | null;
  bidCount: number;
  bidAmount: number;
  bidMessage: BidMessage;
  isSubmitting: boolean;
  now: number;
  onBidAmountChange: (amount: number) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCountdownExpire: () => void;
  user?: { id: string } | null;
}) {
  const currentPrice = auction?.currentPrice ?? listing.currentPrice;
  const minBid = auction?.minimumNextBid ?? currentPrice + listing.minimumIncrement;
  const auctionStatus = auction?.status ?? listing.status;
  const auctionEndTime = auction?.endTime ?? listing.auctionEndTime;
  const auctionEndedByTime = auctionEndTime
    ? new Date(auctionEndTime).getTime() <= now
    : false;
  const auctionOpen = isOpenAuctionStatus(auctionStatus) && !auctionEndedByTime;
  const auctionClosed = isClosedAuctionStatus(auctionStatus) || Boolean(auction?.id && auctionEndedByTime);
  const canBid =
    Boolean(auction?.id) &&
    auctionOpen;

  return (
    <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Harga terkini */}
      <div className="mb-4 rounded-2xl bg-[#002447] px-5 py-4 text-white">
        <p className="text-xs font-medium text-white/70">Harga Terkini</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">
          {formatRupiah(currentPrice)}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {bidCount} penawaran masuk
        </p>
      </div>

      {/* Info harga */}
      <div className="mb-4 space-y-0 rounded-xl bg-[#f6f4ef] px-4 py-1">
        <InfoRow
          label="Harga Awal"
          value={formatRupiah(listing.startingPrice)}
        />
        <InfoRow
          label="Kelipatan Bid Min."
          value={formatRupiah(listing.minimumIncrement)}
        />
        <InfoRow
          label="Min. Bid Berikutnya"
          value={
            <span className="font-semibold text-[#002447]">
              {formatRupiah(minBid)}
            </span>
          }
        />
      </div>

      {/* Countdown */}
      {auctionOpen && auctionEndTime && (
        <div className="mb-4">
          <AuctionCountdown auctionEndTime={auctionEndTime} onExpire={onCountdownExpire} />
        </div>
      )}

      {/* Lelang sudah tutup */}
      {auctionClosed && (
        <div className="mb-4 rounded-2xl bg-gray-100 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-gray-500">
            {auctionStatus === "UNSOLD" ? "🔒 Lelang berakhir tanpa pemenang" : "🔒 Lelang telah berakhir"}
          </p>
          {auctionEndTime && (
            <p className="mt-0.5 text-xs text-gray-400">
              {formatDate(auctionEndTime)}
            </p>
          )}
        </div>
      )}

      {/* Belum dimulai (DRAFT/ACTIVE tapi belum ongoing) */}
      {!auction?.id && !listing.auctionOngoing && listing.status !== "CLOSED" && (
        <div className="mb-4 rounded-2xl bg-yellow-50 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-yellow-700">
            ⏳ Lelang belum dimulai
          </p>
        </div>
      )}

      {bidMessage && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
            bidMessage.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {bidMessage.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Masukkan Penawaran Maksimal Anda (MAX BID, Rp)
        </label>
        {auction && auction.highestBidderId === user?.id && auction.highestBidderMaxAmount !== undefined && (
          <div className="mb-1 text-xs text-green-700">
            Penawaran maksimal Anda saat ini: <b>{formatRupiah(auction.highestBidderMaxAmount)}</b>
          </div>
        )}
        <input
          type="number"
          placeholder={`Min. ${formatRupiah(minBid)}`}
          value={bidAmount}
          min={minBid}
          step={listing.minimumIncrement}
          disabled={!canBid || isSubmitting}
          onChange={(e) => onBidAmountChange(Number(e.target.value))}
          className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canBid || isSubmitting}
          className="w-full rounded-xl bg-[#002447] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#003b70] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Menempatkan Bid..."
            : canBid
            ? "Tempatkan Penawaran (Bid)"
            : "Penawaran Tidak Tersedia"}
        </button>
      </form>
    </div>
  );
}

function BidHistory({ bids }: { bids: Partial<BidResponse>[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-[#002447]">
        Aktivitas Penawaran Terakhir
      </h2>
      {bids.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">
          Belum ada aktivitas penawaran pada barang ini.
        </p>
      ) : (
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {bids.map((bid, index) => (
            <div
              key={bid.id ?? index}
              className="flex items-center justify-between rounded-xl bg-[#f6f4ef] px-3 py-2 text-xs"
            >
              <span className="font-medium text-gray-500">
                {maskBidderDisplay(bid.bidderDisplay) ?? `User ID: ...${bid.bidderId?.slice(-6) ?? "Anonim"}`}
              </span>
              <span className="font-semibold text-gray-900">
                {bid.amount ? formatRupiah(bid.amount) : "-"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListingDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [bidHistory, setBidHistory] = useState<Partial<BidResponse>[]>([]);
  const [bidTotal, setBidTotal] = useState<number | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bidMessage, setBidMessage] = useState<BidMessage>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const refreshAuctionState = useCallback(async () => {
    const auctionRes = await fetch(`/api/bidding/auctions/listings/${id}`, {
      cache: "no-store",
    });

    if (!auctionRes.ok) {
      setAuction(null);
      setBidHistory([]);
      setBidTotal(null);
      return;
    }

    const auctionData = (await auctionRes.json()) as AuctionResponse;
    setAuction(auctionData);
    setBidAmount(auctionData.minimumNextBid);
    setListing((prev) =>
      prev
        ? {
            ...prev,
            status: toListingStatus(auctionData.status, prev.status),
            currentPrice: auctionData.currentPrice,
            auctionEndTime: auctionData.endTime,
            auctionOngoing: isOpenAuctionStatus(auctionData.status),
          }
        : prev
    );

    const bidRes = await fetch(`/api/bidding/auctions/${auctionData.id}/bids`, {
      cache: "no-store",
    });

    if (bidRes.ok) {
      const bidData = normalizeBidPage(await bidRes.json());
      const { bids, total } = bidData;
      setBidHistory(bids);
      setBidTotal(total);
      setListing((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: auctionData.currentPrice,
              bidCount: total,
              auctionEndTime: auctionData.endTime,
            }
          : prev
      );
    } else {
      setBidHistory([]);
      setBidTotal(null);
      setListing((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: auctionData.currentPrice,
              auctionEndTime: auctionData.endTime,
            }
          : prev
      );
    }
  }, [id]);

  const loadListing = useCallback(() => {
    let isMounted = true;

    async function fetchData() {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await fetchListingDetail(id);
        if (isMounted) {
          setListing(data);
          setBidAmount(data.currentPrice + data.minimumIncrement);
          setLoading(false);
        }

        const auctionRes = await fetch(`/api/bidding/auctions/listings/${id}`, {
          cache: "no-store",
        });
        let resolvedAuctionId: string | null = null;

        if (auctionRes.ok) {
          const auctionData = (await auctionRes.json()) as AuctionResponse;
          if (isMounted) {
            setAuction(auctionData);
            setBidAmount(auctionData.minimumNextBid);
            setListing((prev) =>
              prev
                ? {
                    ...prev,
                    status: toListingStatus(auctionData.status, prev.status),
                    currentPrice: auctionData.currentPrice,
                    auctionEndTime: auctionData.endTime,
                    auctionOngoing: isOpenAuctionStatus(auctionData.status),
                  }
                : prev
            );
          }
          resolvedAuctionId = auctionData.id;
        } else if (isMounted) {
          setAuction(null);
          setBidTotal(null);
        }

        if (resolvedAuctionId) {
          const bidRes = await fetch(`/api/bidding/auctions/${resolvedAuctionId}/bids`, {
            cache: "no-store",
          });
          if (bidRes.ok) {
            const { bids, total } = normalizeBidPage(await bidRes.json());
            if (isMounted) {
              setBidHistory(bids);
              setBidTotal(total);
              setListing((prev) =>
                prev
                  ? {
                      ...prev,
                      bidCount: total,
                    }
                  : prev
              );
            }
          } else if (isMounted) {
            setBidHistory([]);
            setBidTotal(null);
          }
        } else if (isMounted) {
          setBidHistory([]);
          setBidTotal(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat detail listing."
          );
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const cleanup = loadListing();
    return cleanup;
  }, [loadListing]);

  useAuctionWebSocket({
    auctionId: auction?.id ?? "",
    onBidPlaced: (eventData) => {
      const incrementValue = listing?.minimumIncrement ?? 10000;
      const nextMinimumBid = eventData.minimumNextBid ?? eventData.amount + incrementValue;

      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: eventData.amount,
              minimumNextBid: nextMinimumBid,
              highestBidderId: eventData.bidderId,
              endTime: eventData.auctionEndTime ?? prev.endTime,
            }
          : prev
      );

      setListing((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: eventData.amount,
              bidCount: eventData.bidCount ?? prev.bidCount + 1,
              auctionEndTime: eventData.auctionEndTime ?? prev.auctionEndTime,
              auctionOngoing: true,
            }
          : prev
      );

      setBidTotal((prev) => eventData.bidCount ?? (prev === null ? 1 : prev + 1));
      setBidAmount(nextMinimumBid);
      setBidHistory((prev) => {
        if (eventData.id && prev.some((bid) => bid.id === eventData.id)) {
          return prev;
        }

        const latest = prev[0];
        if (
          !eventData.id &&
          latest?.amount === eventData.amount &&
          latest?.bidderId === eventData.bidderId
        ) {
          return prev;
        }

        return [eventData, ...prev];
      });
    },
    onAuctionEnded: () => {
      void refreshAuctionState();
    },
  });

  const handlePlaceBid = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!listing) return;

      if (!user) {
        router.push("/login");
        return;
      }

      const minBidRequired =
        auction?.minimumNextBid ?? listing.currentPrice + listing.minimumIncrement;

      if (!auction?.id) {
        setBidMessage({
          type: "error",
          text: "Auction belum tersedia untuk listing ini.",
        });
        return;
      }

      if (bidAmount < minBidRequired) {
        setBidMessage({
          type: "error",
          text: `Nominal bid minimal harus ${formatRupiah(minBidRequired)}`,
        });
        return;
      }

      try {
        setIsSubmitting(true);
        setBidMessage(null);

        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${id}-${Date.now()}-${Math.random()}`;

        const res = await fetch(`/api/bidding/auctions/${auction.id}/bids`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({ amount: bidAmount }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            (data as { error?: string; message?: string }).error ||
              (data as { error?: string; message?: string }).message ||
              "Gagal mengajukan penawaran."
          );
        }

        const placedBid = data as Partial<BidResponse>;
        if (placedBid.amount !== undefined) {
          const nextBid = placedBid.amount + listing.minimumIncrement;
          setAuction((prev) =>
            prev
              ? {
                  ...prev,
                  currentPrice: placedBid.amount ?? prev.currentPrice,
                  minimumNextBid: nextBid,
                  highestBidderId: placedBid.bidderId ?? prev.highestBidderId,
                  endTime: placedBid.auctionEndTime ?? prev.endTime,
                }
              : prev
          );
          setListing((prev) =>
            prev
              ? {
                  ...prev,
                  currentPrice: placedBid.amount ?? prev.currentPrice,
                  bidCount: prev.bidCount + 1,
                  auctionEndTime: placedBid.auctionEndTime ?? prev.auctionEndTime,
                  auctionOngoing: true,
                }
              : prev
          );
          setBidTotal((prev) => (prev === null ? 1 : prev + 1));
          setBidAmount(nextBid);
          setBidHistory((prev) =>
            placedBid.id
              ? [placedBid, ...prev.filter((bid) => bid.id !== placedBid.id)]
              : prev
          );
        }

        await refreshAuctionState();

        setBidMessage({
          type: "success",
          text: "Penawaran Anda berhasil ditempatkan.",
        });
      } catch (err) {
        let msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
        // Custom error message for same-max bid
        if (msg.includes("penawar tertinggi") && msg.includes("maksimal")) {
          msg = "Anda sudah menjadi penawar tertinggi. Untuk menaikkan tawaran, masukkan jumlah yang lebih besar dari batas maksimal Anda saat ini.";
        }
        setBidMessage({
          type: "error",
          text: msg,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [auction, bidAmount, id, listing, refreshAuctionState, router, user]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f4ef]">
        <div className="bg-[#002447] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/20" />
          </div>
        </div>
        <DetailSkeleton />
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-[#f6f4ef]">
        <div className="bg-[#002447] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <Link href="/catalog" className="text-sm text-white/70 hover:text-white">
              ← Kembali ke Katalog
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-red-50 px-6 py-10 text-center">
            <span className="text-5xl">😕</span>
            <h2 className="mt-4 text-lg font-semibold text-red-700">
              {error ?? "Listing tidak ditemukan"}
            </h2>
            <p className="mt-1 text-sm text-red-500">
              Listing mungkin sudah dihapus atau ID tidak valid.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={loadListing}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Coba Lagi
              </button>
              <Link
                href="/catalog"
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Kembali ke Katalog
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const auctionEndTime = auction?.endTime ?? listing.auctionEndTime;
  const auctionEndedByTime = auctionEndTime
    ? new Date(auctionEndTime).getTime() <= now
    : false;
  const displayStatus: ListingDetail["status"] = auction
    ? isClosedAuctionStatus(auction.status) || auctionEndedByTime
      ? "CLOSED"
      : "ACTIVE"
    : listing.status === "ACTIVE" && !listing.auctionOngoing
    ? "CLOSED"
    : listing.status;
  const displayedBidCount = bidTotal ?? listing.bidCount;

  return (
    <main className="min-h-screen bg-[#f6f4ef]">
      {/* Breadcrumb */}
      <div className="bg-[#002447] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-sm text-white/70">
          <Link href="/catalog" className="transition-colors hover:text-white">
            Katalog
          </Link>
          <span>/</span>
          {listing.categoryName && (
            <>
              <span>{listing.categoryName}</span>
              <span>/</span>
            </>
          )}
          <span className="line-clamp-1 text-white">{listing.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">

          {/* ── Kolom Kiri: Galeri + Deskripsi ── */}
          <div className="lg:col-span-3">
            {/* Galeri */}
            <ListingGallery images={listing.images} title={listing.title} />

            {/* Judul & meta */}
            <div className="mt-6">
              <div className="flex flex-wrap items-start gap-2">
                <h1 className="flex-1 text-xl font-bold text-gray-900 sm:text-2xl">
                  {listing.title}
                </h1>
                <StatusBadge status={displayStatus} />
              </div>

              {listing.categoryName && (
                <p className="mt-1 text-sm text-gray-400">
                  Kategori:{" "}
                  <span className="font-medium text-gray-600">
                    {listing.categoryName}
                  </span>
                </p>
              )}

              <p className="mt-1 text-xs text-gray-400">
                Ditayangkan {formatDate(listing.activatedAt ?? listing.createdAt)}
              </p>
            </div>

            {/* Deskripsi */}
            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[#002447]">
                Deskripsi Produk
              </h2>
              {listing.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {listing.description}
                </p>
              ) : (
                <p className="text-sm italic text-gray-400">
                  Tidak ada deskripsi.
                </p>
              )}
            </div>

            {/* Info tambahan */}
            <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-[#002447]">
                Informasi Lelang
              </h2>
              <div className="divide-y divide-gray-50">
                <InfoRow label="Total Penawaran" value={`${displayedBidCount} bid`} />
                <InfoRow label="Harga Awal" value={formatRupiah(listing.startingPrice)} />
                <InfoRow label="Kelipatan Bid" value={formatRupiah(listing.minimumIncrement)} />
                <InfoRow label="Waktu Mulai" value={formatDate(listing.activatedAt)} />
                <InfoRow label="Waktu Berakhir" value={formatDate(listing.auctionEndTime)} />
              </div>
            </div>
          </div>

          {/* ── Kolom Kanan: Bid Card ── */}
          <div className="space-y-4 lg:col-span-2">
            {/* Penjelasan Proxy Bidding */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <b>Cara Kerja Penawaran Maksimal (Proxy Bidding)</b>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Ketika Anda memasukkan penawaran, sistem akan menahan saldo Anda sebesar <b>penawaran maksimal</b> yang Anda masukkan.</li>
                <li>Namun, Anda hanya akan membayar <b>harga akhir lelang</b> (harga tertinggi yang diperlukan untuk menang), bukan seluruh penawaran maksimal Anda.</li>
                <li>Jika Anda menang dengan harga lebih rendah dari penawaran maksimal, sisa saldo yang ditahan akan dikembalikan ke dompet Anda secara otomatis.</li>
                <li>Jika Anda kalah, seluruh saldo yang ditahan akan dikembalikan.</li>
              </ul>
              <div className="mt-2 text-xs text-blue-700">
                Contoh: Jika Anda memasukkan penawaran maksimal Rp120.000, tetapi hanya perlu membayar Rp107.000 untuk menang, maka Rp13.000 akan dikembalikan ke dompet Anda setelah lelang selesai.
              </div>
            </div>
            {/* Info Penawaran Pengguna (jika tersedia) */}
            {auction && user && auction.highestBidderId === user.id && (
              <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-xs text-green-900">
                <b>Anda adalah penawar tertinggi!</b><br />
                Penawaran maksimal Anda: <b>{formatRupiah(auction.highestBidderMaxAmount ?? 0)}</b><br />
                Harga saat ini: <b>{formatRupiah(auction.currentPrice)}</b><br />
                Anda hanya akan membayar harga akhir, sisa saldo akan dikembalikan.
              </div>
            )}
            <BidCard
              listing={listing}
              auction={auction}
              bidCount={displayedBidCount}
              bidAmount={bidAmount}
              bidMessage={bidMessage}
              isSubmitting={isSubmitting}
              now={now}
              onBidAmountChange={setBidAmount}
              onSubmit={handlePlaceBid}
              onCountdownExpire={refreshAuctionState}
              user={user}
            />
            <BidHistory bids={bidHistory} />
          </div>
        </div>
      </div>
    </main>
  );
}
