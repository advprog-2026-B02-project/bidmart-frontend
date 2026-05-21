"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCategories } from "@/lib/catalog.api";
import { createListing, editListing } from "@/lib/seller.api";
import type { ListingImageRequest } from "@/lib/seller.api";
import type { Category, ListingDetail } from "@/types/catalog";
import type { CreateListingPayload, EditListingPayload } from "@/lib/seller.api";

interface Props {
  listingToEdit?: ListingDetail;
  onClose: () => void;
  onSuccess: (updated: ListingDetail) => void;
}

interface FormState {
  categoryId: string;
  title: string;
  description: string;
  startingPrice: string;
  reservePrice: string;
  minimumIncrement: string;
  auctionDuration: string;
}

interface ImageRow {
  url: string;
}

const EMPTY_FORM: FormState = {
  categoryId: "",
  title: "",
  description: "",
  startingPrice: "",
  reservePrice: "",
  minimumIncrement: "",
  auctionDuration: "",
};

const EMPTY_IMAGE_ROW: ImageRow = { url: "" };

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

export default function ListingFormModal({
  listingToEdit,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = listingToEdit !== undefined;

  const [form, setForm] = useState<FormState>(() => {
    if (listingToEdit) {
      return {
        categoryId: listingToEdit.categoryId,
        title: listingToEdit.title,
        description: listingToEdit.description ?? "",
        startingPrice: String(listingToEdit.startingPrice),
        reservePrice:
          listingToEdit.reservePrice != null
            ? String(listingToEdit.reservePrice)
            : "",
        minimumIncrement: String(listingToEdit.minimumIncrement),
        auctionDuration: String(listingToEdit.auctionDuration),
      };
    }
    return EMPTY_FORM;
  });

  const [imageRows, setImageRows] = useState<ImageRow[]>(() => {
    if (listingToEdit?.images?.length) {
      return [...listingToEdit.images]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((img) => ({
          url: img.url,
        }));
    }
    return [{ ...EMPTY_IMAGE_ROW }];
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof FormState | "images", string>>
  >({});

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      if (isMounted) setCatLoading(true);
      try {
        const data = await fetchCategories();
        if (isMounted) {
          setCategories(data);
          setCatLoading(false);
        }
      } catch {
        if (isMounted) {
          setCategories([]);
          setCatLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [setForm, setValidationErrors]
  );

  const handleImageChange = useCallback(
    (index: number, field: keyof ImageRow, value: string) => {
      setImageRows((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      );
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
    },
    [setImageRows, setValidationErrors]
  );

  const handleAddImage = useCallback(() => {
    setImageRows((prev) => [...prev, { ...EMPTY_IMAGE_ROW }]);
  }, [setImageRows]);

  const handleRemoveImage = useCallback((index: number) => {
    setImageRows((prev) => prev.filter((_, i) => i !== index));
  }, [setImageRows]);

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState | "images", string>> = {};

    if (!form.categoryId) errors.categoryId = "Kategori wajib dipilih.";

    if (!form.title.trim()) {
      errors.title = "Judul wajib diisi.";
    } else if (form.title.length > 200) {
      errors.title = "Judul maksimal 200 karakter.";
    }

    const startP = Number(form.startingPrice);
    if (!form.startingPrice || isNaN(startP) || startP <= 0)
      errors.startingPrice = "Harga awal harus lebih dari 0.";

    if (form.reservePrice) {
      const rp = Number(form.reservePrice);
      if (isNaN(rp) || rp <= 0)
        errors.reservePrice = "Harga reserve harus lebih dari 0 jika diisi.";
    }

    const minInc = Number(form.minimumIncrement);
    if (!form.minimumIncrement || isNaN(minInc) || minInc <= 0)
      errors.minimumIncrement = "Minimum kenaikan harus lebih dari 0.";

    const dur = Number(form.auctionDuration);
    if (!form.auctionDuration || isNaN(dur) || dur < 60)
      errors.auctionDuration = "Durasi lelang minimal 60 detik.";

    const filledRows = imageRows.filter((r) => r.url.trim());
    for (const row of filledRows) {
      if (row.url.length > 2048) {
        errors.images = "URL gambar maksimal 2048 karakter.";
        break;
      }

    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function buildImages(): ListingImageRequest[] {
    return imageRows
      .filter((r) => r.url.trim())
      .map((r, index) => ({
        url: r.url.trim(),
        thumbnailUrl: r.url.trim(),
        displayOrder: index,
      }));
  }

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const images = buildImages();
      let result: ListingDetail;

      if (isEdit && listingToEdit) {
        const payload: EditListingPayload = {
          categoryId: form.categoryId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          startingPrice: Number(form.startingPrice),
          reservePrice: form.reservePrice ? Number(form.reservePrice) : null,
          minimumIncrement: Number(form.minimumIncrement),
          auctionDuration: Number(form.auctionDuration),
          images,
        };
        result = await editListing(listingToEdit.id, payload);
      } else {
        const payload: CreateListingPayload = {
          categoryId: form.categoryId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          startingPrice: Number(form.startingPrice),
          reservePrice: form.reservePrice ? Number(form.reservePrice) : null,
          minimumIncrement: Number(form.minimumIncrement),
          auctionDuration: Number(form.auctionDuration),
          images,
        };
        result = await createListing(payload);
      }

      onSuccess(result);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi."
      );
    } finally {
      setSubmitLoading(false);
    }
  }, [form, isEdit, listingToEdit, onSuccess, buildImages, validate]);

  function renderCategoryOptions() {
    return categories.map((root) => {
      const rootChildren = root.children ?? [];

      if (rootChildren.length === 0) {
        return (
          <option key={root.id} value={root.id}>
            {root.name}
          </option>
        );
      }

      return (
        <optgroup key={root.id} label={root.name}>
          {rootChildren.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </optgroup>
      );
    });
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-[#002447]">
            {isEdit ? "✏️ Edit Listing" : "➕ Listing Baru"}
          </h2>
          <button
            onClick={onClose}
            disabled={submitLoading}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">

            {/* ── Kategori ── */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kategori <span className="text-red-500">*</span>
              </label>
              {catLoading ? (
                <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
              ) : categories.length === 0 ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
                  Belum ada kategori tersedia. Tambahkan kategori terlebih dahulu.
                </div>
              ) : (
                <select
                  value={form.categoryId}
                  onChange={(e) => handleChange("categoryId", e.target.value)}
                  className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {renderCategoryOptions()}
                </select>
              )}
              {validationErrors.categoryId && (
                <FieldError msg={validationErrors.categoryId} />
              )}
            </div>

            {/* ── Judul ── */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Judul Listing <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="cth. iPhone 15 Pro Max Mulus"
                value={form.title}
                maxLength={200}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
              />
              <p className="mt-0.5 text-right text-xs text-gray-400">
                {form.title.length}/200
              </p>
              {validationErrors.title && (
                <FieldError msg={validationErrors.title} />
              )}
            </div>

            {/* ── Deskripsi ── */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Deskripsi{" "}
                <span className="text-xs font-normal text-gray-400">
                  (opsional)
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan kondisi, kelengkapan, garansi, dll..."
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="w-full resize-none rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
              />
            </div>

            {/* ── Harga Awal & Reserve ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Harga Awal (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="cth. 15000000"
                  value={form.startingPrice}
                  min={1}
                  onChange={(e) =>
                    handleChange("startingPrice", e.target.value)
                  }
                  className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
                />
                {validationErrors.startingPrice && (
                  <FieldError msg={validationErrors.startingPrice} />
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Harga Reserve (Rp){" "}
                  <span className="text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="cth. 16000000"
                  value={form.reservePrice}
                  min={1}
                  onChange={(e) =>
                    handleChange("reservePrice", e.target.value)
                  }
                  className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
                />
                {validationErrors.reservePrice && (
                  <FieldError msg={validationErrors.reservePrice} />
                )}
              </div>
            </div>

            {/* ── Minimum Kenaikan & Durasi ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Min. Kenaikan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="cth. 100000"
                  value={form.minimumIncrement}
                  min={1}
                  onChange={(e) =>
                    handleChange("minimumIncrement", e.target.value)
                  }
                  className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
                />
                {validationErrors.minimumIncrement && (
                  <FieldError msg={validationErrors.minimumIncrement} />
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Durasi Lelang (detik) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="cth. 604800"
                  value={form.auctionDuration}
                  min={60}
                  onChange={(e) =>
                    handleChange("auctionDuration", e.target.value)
                  }
                  className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002447]/25"
                />
                {form.auctionDuration &&
                  !isNaN(Number(form.auctionDuration)) && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      ≈ {(Number(form.auctionDuration) / 86400).toFixed(1)} hari
                    </p>
                  )}
                {validationErrors.auctionDuration && (
                  <FieldError msg={validationErrors.auctionDuration} />
                )}
              </div>
            </div>

            {/* ── Gambar ── */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Gambar{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (opsional, paste URL)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="rounded-lg border border-[#002447]/20 px-2.5 py-1 text-xs font-semibold text-[#002447] transition-colors hover:bg-[#002447]/5"
                >
                  + Tambah Gambar
                </button>
              </div>

              <div className="space-y-3">
                {imageRows.map((row, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-100 bg-[#f6f4ef] p-3"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        Gambar {index + 1}
                        {index === 0 && (
                          <span className="ml-1 text-[#002447]">(thumbnail)</span>
                        )}
                      </span>
                      {imageRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-xs text-red-400 transition-colors hover:text-red-600"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="URL gambar (wajib jika diisi)"
                      value={row.url}
                      onChange={(e) =>
                        handleImageChange(index, "url", e.target.value)
                      }
                      className="w-full rounded-xl bg-white px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#002447]/25"
                    />
                  </div>
                ))}
              </div>

              {validationErrors.images && (
                <FieldError msg={validationErrors.images} />
              )}
            </div>

            {/* ── Error submit ── */}
            {submitError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {submitError}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            disabled={submitLoading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitLoading}
            className="rounded-lg bg-[#002447] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b70] disabled:opacity-60"
          >
            {submitLoading
              ? isEdit
                ? "Menyimpan..."
                : "Membuat..."
              : isEdit
              ? "Simpan Perubahan"
              : "Buat Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
