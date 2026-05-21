"use client";
import { useState } from "react";
import Image from "next/image";
import type { CatalogImage } from "@/types/catalog";

interface Props {
  images: CatalogImage[];
  title: string;
}

const PLACEHOLDER_BG = "bg-[#f6f4ef]";

export default function ListingGallery({ images, title }: Props) {
  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);

  const [activeIndex, setActiveIndex] = useState(0);

  const active = sorted[activeIndex] ?? null;

  const mainImageUrl = active?.url ?? null;

  function thumbUrl(img: CatalogImage): string {
    return img.thumbnailUrl ?? img.url;
  }

  if (sorted.length === 0) {
    return (
      <div
        className={`flex h-80 w-full items-center justify-center rounded-2xl ${PLACEHOLDER_BG}`}
      >
        <div className="text-center">
          <span className="text-6xl text-gray-300">🏷️</span>
          <p className="mt-2 text-sm text-gray-400">Tidak ada foto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Gambar Utama ── */}
      <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-[#f6f4ef] sm:h-96">
        {mainImageUrl ? (
          <Image
            src={mainImageUrl}
            alt={title}
            width={800}
            height={600}
            className="h-full w-full object-contain"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl text-gray-300">🏷️</span>
          </div>
        )}

        {/* Badge urutan gambar jika lebih dari satu */}
        {sorted.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {sorted.length}
          </span>
        )}
      </div>

      {/* ── Thumbnail Strip ── */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                index === activeIndex
                  ? "border-[#002447] opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Lihat gambar ${index + 1}`}
            >
              <Image
                src={thumbUrl(img)}
                alt={`${title} — foto ${index + 1}`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}