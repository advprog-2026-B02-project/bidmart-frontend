"use client";
import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchListingDetail } from "@/lib/catalog.api";
import type { ListingDetail } from "@/types/catalog";
import ListingGallery from "@/components/catalog/ListingGallery";
import AuctionCountdown from "@/components/catalog/AuctionCountdown";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

function StatusBadge({ status }: { status: ListingDetail["status"] }) {
  const map: Record<ListingDetail["status"], { label: string; className: string }> = {
    DRAFT:  { label: "Draft",    className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    ACTIVE: { label: "Aktif",    className: "bg-green-100 text-green-700 border-green-200" },
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

function BidCard({ listing }: { listing: ListingDetail }) {
  const [bidAmount, setBidAmount] = useState("");
  const canBid = listing.auctionOngoing && listing.status === "ACTIVE";
  const minBid = listing.currentPrice + listing.minimumIncrement;

  return (
    <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Harga terkini */}
      <div className="mb-4 rounded-2xl bg-[#002447] px-5 py-4 text-white">
        <p className="text-xs font-medium text-white/70">Harga Terkini</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">
          {formatRupiah(listing.currentPrice)}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {listing.bidCount} penawaran masuk
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
      {listing.auctionOngoing && listing.auctionEndTime && (
        <div className="mb-4">
          <AuctionCountdown auctionEndTime={listing.auctionEndTime} />
        </div>
      )}

      {/* Lelang sudah tutup */}
      {!listing.auctionOngoing && listing.status === "CLOSED" && (
        <div className="mb-4 rounded-2xl bg-gray-100 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-gray-500">
            🔒 Lelang telah berakhir
          </p>
          {listing.auctionEndTime && (
            <p className="mt-0.5 text-xs text-gray-400">
              {formatDate(listing.auctionEndTime)}
            </p>
          )}
        </div>
      )}

      {/* Belum dimulai (DRAFT/ACTIVE tapi belum ongoing) */}
      {!listing.auctionOngoing && listing.status !== "CLOSED" && (
        <div className="mb-4 rounded-2xl bg-yellow-50 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-yellow-700">
            ⏳ Lelang belum dimulai
          </p>
        </div>
      )}

      {/* Input bid — placeholder, akan tersambung ke Bidding Service */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Jumlah Penawaran (Rp)
        </label>
        <input
          type="number"
          placeholder={`Min. ${formatRupiah(minBid)}`}
          value={bidAmount}
          min={minBid}
          step={listing.minimumIncrement}
          disabled={!canBid}
          onChange={(e) => setBidAmount(e.target.value)}
          className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          disabled={!canBid}
          className="w-full rounded-xl bg-[#002447] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#003b70] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            // TODO: sambungkan ke Bidding Service
          }}
        >
          {canBid ? "Tempatkan Penawaran (Bid)" : "Penawaran Tidak Tersedia"}
        </button>
        {canBid && (
          <p className="text-center text-xs text-gray-400">
            Fitur bid akan segera tersedia
          </p>
        )}
      </div>
    </div>
  );
}

export default function ListingDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setLoading(false);
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
                <StatusBadge status={listing.status} />
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
                <InfoRow label="Total Penawaran" value={`${listing.bidCount} bid`} />
                <InfoRow label="Harga Awal" value={formatRupiah(listing.startingPrice)} />
                <InfoRow label="Kelipatan Bid" value={formatRupiah(listing.minimumIncrement)} />
                <InfoRow label="Waktu Mulai" value={formatDate(listing.activatedAt)} />
                <InfoRow label="Waktu Berakhir" value={formatDate(listing.auctionEndTime)} />
              </div>
            </div>
          </div>

          {/* ── Kolom Kanan: Bid Card ── */}
          <div className="lg:col-span-2">
            <BidCard listing={listing} />
          </div>
        </div>
      </div>
    </main>
  );
}