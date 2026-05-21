"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  fetchSellerListings,
  activateListing,
  cancelListing,
  deleteListing,
} from "@/lib/seller.api";
import type { ListingDetail } from "@/types/catalog";
import ListingFormModal from "@/components/seller/ListingFormModal";

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
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function getDisplayStatus(
  listing: ListingDetail,
  now: number
): ListingDetail["status"] {
  if (
    listing.status === "ACTIVE" &&
    (listing.auctionOngoing === false ||
      (listing.auctionEndTime &&
        new Date(listing.auctionEndTime).getTime() <= now))
  ) {
    return "CLOSED";
  }

  return listing.status;
}

function StatusBadge({ status }: { status: ListingDetail["status"] }) {
  const map: Record<
    ListingDetail["status"],
    { label: string; className: string }
  > = {
    DRAFT: {
      label: "Draft",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    ACTIVE: {
      label: "Aktif",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    CLOSED: {
      label: "Ditutup",
      className: "bg-gray-100 text-gray-500 border-gray-200",
    },
  };

  const { label, className } = map[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClassName,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${confirmClassName}`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="h-14 w-14 shrink-0 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/2 rounded-full bg-gray-200" />
        <div className="h-3 w-1/3 rounded-full bg-gray-200" />
      </div>
      <div className="h-6 w-16 rounded-full bg-gray-200" />
      <div className="h-8 w-24 rounded-lg bg-gray-200" />
    </div>
  );
}

interface ListingRowProps {
  listing: ListingDetail;
  now: number;
  onEdit: (listing: ListingDetail) => void;
  onActivate: (listing: ListingDetail) => void;
  onCancel: (listing: ListingDetail) => void;
  onDelete: (listing: ListingDetail) => void;
}

function ListingRow({
  listing,
  now,
  onEdit,
  onActivate,
  onCancel,
  onDelete,
}: ListingRowProps) {
  const thumbnail = listing.images?.length
    ? (listing.images.find((img) => img.displayOrder === 0) ??
      listing.images[0])
    : null;

  const imageUrl =
    thumbnail?.thumbnailUrl ?? thumbnail?.url ?? null;

  const displayStatus = getDisplayStatus(listing, now);

  const canEdit =
    displayStatus === "DRAFT" ||
    (displayStatus === "ACTIVE" && listing.bidCount === 0);

  const canActivate = displayStatus === "DRAFT";
  const canCancel = displayStatus !== "CLOSED";
  const canDelete = displayStatus === "DRAFT";

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start gap-4">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f6f4ef]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">
              🏷️
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">
              {listing.title}
            </h3>
            <StatusBadge status={displayStatus} />
          </div>

          <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
            {listing.categoryName ?? "Tanpa kategori"}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>
              <span className="font-medium text-[#002447]">
                {formatRupiah(listing.currentPrice)}
              </span>{" "}
              harga saat ini
            </span>
            <span>{listing.bidCount} bid</span>
            <span>
              Dibuat {formatDate(listing.createdAt)}
            </span>
            {listing.auctionEndTime && (
              <span>Berakhir {formatDate(listing.auctionEndTime)}</span>
            )}
          </div>
        </div>

        {/* Aksi */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Edit */}
          {canEdit && (
            <button
              onClick={() => onEdit(listing)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Edit
            </button>
          )}

          {/* Activate */}
          {canActivate && (
            <button
              onClick={() => onActivate(listing)}
              className="rounded-lg bg-[#002447] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#003b70]"
            >
              Aktifkan
            </button>
          )}

          {/* Cancel */}
          {canCancel && (
            <button
              onClick={() => onCancel(listing)}
              className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-50"
            >
              Batalkan
            </button>
          )}

          {/* Delete */}
          {canDelete && (
            <button
              onClick={() => onDelete(listing)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type ActiveDialog =
  | { type: "activate"; listing: ListingDetail }
  | { type: "cancel"; listing: ListingDetail }
  | { type: "delete"; listing: ListingDetail };

type FilterTab = "SEMUA" | "DRAFT" | "ACTIVE" | "CLOSED";

const TABS: FilterTab[] = ["SEMUA", "DRAFT", "ACTIVE", "CLOSED"];

const TAB_LABELS: Record<FilterTab, string> = {
  SEMUA: "Semua",
  DRAFT: "Draft",
  ACTIVE: "Aktif",
  CLOSED: "Ditutup",
};

export default function SellerListingsPage() {
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ListingDetail | undefined>(
    undefined
  );
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<FilterTab>("SEMUA");
  const [now, setNow] = useState(() => Date.now());

  const loadListings = useCallback(() => {
    let cancelled = false;

    function applyResult(data: ListingDetail[]) {
      if (!cancelled) {
        setListings(data);
        setLoading(false);
        setError(null);
      }
    }

    function applyError(msg: string) {
      if (!cancelled) {
        setError(msg);
        setLoading(false);
      }
    }

    async function fetchData() {
      if (!cancelled) setLoading(true);
      try {
        const data = await fetchSellerListings();
        applyResult(data);
      } catch (err) {
        applyError(
          err instanceof Error
            ? err.message
            : "Gagal memuat daftar listing kamu."
        );
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = loadListings();
    return cleanup;
  }, [loadListings]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCreateSuccess = useCallback((created: ListingDetail) => {
    setShowCreateModal(false);
    setListings((prev) => [created, ...prev]);
  }, []);

  const handleEditSuccess = useCallback((updated: ListingDetail) => {
    setEditTarget(undefined);
    setListings((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l))
    );
  }, []);

  const handleDialogConfirm = useCallback(async () => {
    if (!activeDialog) return;
    const dialog = activeDialog;

    let cancelled = false;

    function applySuccess(updated?: ListingDetail) {
      if (!cancelled) {
        setDialogLoading(false);
        setActiveDialog(null);
        setDialogError(null);

        if (dialog.type === "delete") {
          setListings((prev) =>
            prev.filter((l) => l.id !== dialog.listing.id)
          );
        } else if (updated) {
          setListings((prev) =>
            prev.map((l) => (l.id === updated.id ? updated : l))
          );
        }
      }
    }

    function applyError(msg: string) {
      if (!cancelled) {
        setDialogError(msg);
        setDialogLoading(false);
      }
    }

    if (!cancelled) {
      setDialogLoading(true);
      setDialogError(null);
    }

    try {
      if (dialog.type === "activate") {
        const updated = await activateListing(dialog.listing.id);
        applySuccess(updated);
      } else if (dialog.type === "cancel") {
        await cancelListing(dialog.listing.id);
        applySuccess({ ...dialog.listing, status: "CLOSED" });
      } else if (dialog.type === "delete") {
        await deleteListing(dialog.listing.id);
        applySuccess();
      }
    } catch (err) {
      applyError(
        err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi."
      );
    }

    return () => {
      cancelled = true;
    };
  }, [activeDialog]);

  const filteredListings =
    activeTab === "SEMUA"
      ? listings
      : listings.filter((l) => getDisplayStatus(l, now) === activeTab);

  const showFormModal = showCreateModal || editTarget !== undefined;

  return (
    <>
      <main className="min-h-screen bg-[#f6f4ef]">
        {/* Header */}
        <div className="bg-[#002447] px-4 py-10 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Listing Saya
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Kelola barang lelang yang kamu pasarkan di BidMart
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#002447] transition-colors hover:bg-[#f6f4ef]"
            >
              ➕ Listing Baru
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Error state */}
          {error && !loading && (
            <div className="mb-6 rounded-2xl bg-red-50 px-6 py-5 text-sm text-red-600">
              <p className="font-semibold">Gagal memuat listing</p>
              <p className="mt-1 text-red-500">{error}</p>
              <button
                onClick={loadListings}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Tab filter */}
          {!error && (
            <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
              {TABS.map((tab) => {
                const count =
                  tab === "SEMUA"
                    ? listings.length
                    : listings.filter((l) => getDisplayStatus(l, now) === tab)
                        .length;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-[#002447] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs ${
                        activeTab === tab
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredListings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="mb-4 text-6xl">📦</span>
              <h3 className="text-lg font-semibold text-gray-700">
                {activeTab === "SEMUA"
                  ? "Kamu belum punya listing"
                  : `Tidak ada listing berstatus "${TAB_LABELS[activeTab]}"`}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {activeTab === "SEMUA"
                  ? "Mulai dengan membuat listing pertamamu."
                  : "Coba pilih tab lain untuk melihat listing kamu."}
              </p>
              {activeTab === "SEMUA" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-5 rounded-lg bg-[#002447] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003b70]"
                >
                  Buat Listing Pertama
                </button>
              )}
            </div>
          )}

          {/* Listing list */}
          {!loading && !error && filteredListings.length > 0 && (
            <div className="space-y-3">
              {filteredListings.map((listing) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  now={now}
                  onEdit={(l) => setEditTarget(l)}
                  onActivate={(l) =>
                    setActiveDialog({ type: "activate", listing: l })
                  }
                  onCancel={(l) =>
                    setActiveDialog({ type: "cancel", listing: l })
                  }
                  onDelete={(l) =>
                    setActiveDialog({ type: "delete", listing: l })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Form Modal (Create / Edit) ── */}
      {showFormModal && (
        <ListingFormModal
          listingToEdit={editTarget}
          onClose={() => {
            setShowCreateModal(false);
            setEditTarget(undefined);
          }}
          onSuccess={editTarget ? handleEditSuccess : handleCreateSuccess}
        />
      )}

      {/* ── Dialog Konfirmasi Activate ── */}
      {activeDialog?.type === "activate" && (
        <>
          {dialogError && (
            <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-red-50 px-5 py-3 text-sm text-red-600 shadow-lg">
              {dialogError}
            </div>
          )}
          <ConfirmDialog
            title="Aktifkan Listing?"
            description={`"${activeDialog.listing.title}" akan langsung tampil di katalog publik dan lelang dimulai. Tindakan ini tidak bisa dibatalkan kecuali belum ada bid.`}
            confirmLabel="Ya, Aktifkan"
            confirmClassName="bg-[#002447] hover:bg-[#003b70]"
            loading={dialogLoading}
            onConfirm={handleDialogConfirm}
            onCancel={() => {
              setActiveDialog(null);
              setDialogError(null);
            }}
          />
        </>
      )}

      {/* ── Dialog Konfirmasi Cancel ── */}
      {activeDialog?.type === "cancel" && (
        <>
          {dialogError && (
            <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-red-50 px-5 py-3 text-sm text-red-600 shadow-lg">
              {dialogError}
            </div>
          )}
          <ConfirmDialog
            title="Batalkan Listing?"
            description={`"${activeDialog.listing.title}" akan ditutup dan tidak bisa dibuka kembali. Lanjutkan?`}
            confirmLabel="Ya, Batalkan"
            confirmClassName="bg-orange-600 hover:bg-orange-700"
            loading={dialogLoading}
            onConfirm={handleDialogConfirm}
            onCancel={() => {
              setActiveDialog(null);
              setDialogError(null);
            }}
          />
        </>
      )}

      {/* ── Dialog Konfirmasi Delete ── */}
      {activeDialog?.type === "delete" && (
        <>
          {dialogError && (
            <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-red-50 px-5 py-3 text-sm text-red-600 shadow-lg">
              {dialogError}
            </div>
          )}
          <ConfirmDialog
            title="Hapus Listing Secara Permanen?"
            description={`"${activeDialog.listing.title}" akan dihapus dan tidak bisa dipulihkan. Yakin?`}
            confirmLabel="Hapus Sekarang"
            confirmClassName="bg-red-600 hover:bg-red-700"
            loading={dialogLoading}
            onConfirm={handleDialogConfirm}
            onCancel={() => {
              setActiveDialog(null);
              setDialogError(null);
            }}
          />
        </>
      )}
    </>
  );
}
