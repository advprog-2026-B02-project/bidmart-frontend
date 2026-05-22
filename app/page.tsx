"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CatalogItem } from "@/types/catalog";
import AuctionCard from "@/components/AuctionCard";
import {useAuth} from "@/context/AuthContext";
import {canAccessSellerArea} from "@/lib/navigation";
import { toEpochMillis } from "@/lib/utils/dateTime";

function isAuctionOngoing(listing: CatalogItem): boolean {
  if (listing.status !== "ACTIVE" || !listing.auctionEndTime) return false;
  const endTime = toEpochMillis(listing.auctionEndTime);
  return endTime !== null && endTime > Date.now();
}

export default function HomePage() {
  const {user} = useAuth();
  const [listings, setListings] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/catalog");

        if (!res.ok) {
          const responseText = await res.text();
          let message = "Gagal mengambil data katalog lelang.";
          try {
            const data = responseText ? JSON.parse(responseText) : null;
            message = data?.message || data?.error || message;
          } catch {
            message = responseText || message;
          }
          throw new Error(message);
        }

        const data = await res.json();
        setListings((data.content || []).filter(isAuctionOngoing));
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || "Terjadi kesalahan koneksi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setListings((current) => current.filter(isAuctionOngoing));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Utama Halaman */}
      <div className="md:flex md:items-center md:justify-between border-b border-gray-100 pb-6 mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Katalog Lelang Aktif
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Jelajahi barang-barang populer dan ajukan penawaran Anda secara langsung.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
          {user ? (
            <>
              <Link
                href="/wallet"
                className="rounded-lg border border-bidnavy/20 bg-white px-4 py-2 text-sm font-bold text-bidnavy shadow-sm hover:bg-bidcream"
              >
                Wallet
              </Link>
              <Link
                href="/orders"
                className="rounded-lg border border-bidnavy/20 bg-white px-4 py-2 text-sm font-bold text-bidnavy shadow-sm hover:bg-bidcream"
              >
                Pesanan
              </Link>
              {canAccessSellerArea(user.roles) && (
                <Link
                  href="/seller/listings"
                  className="rounded-lg bg-bidnavy px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-bidnavy2"
                >
                  Buat Lelang
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-bidnavy/20 bg-white px-4 py-2 text-sm font-bold text-bidnavy shadow-sm hover:bg-bidcream"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-bidnavy px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-bidnavy2"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Kondisi Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4 animate-pulse">
              <div className="aspect-square w-full rounded-2xl bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {/* Kondisi Error State */}
      {error && !isLoading && (
        <div className="rounded-2xl bg-red-50 p-6 text-center border border-red-100 max-w-xl mx-auto my-12">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-bidcream"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Kondisi Data Kosong */}
      {!isLoading && !error && listings.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-400">Belum ada barang lelang yang aktif saat ini.</p>
        </div>
      )}

      {/* Grid Grid Menampilkan Listing / Barang */}
      {!isLoading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {listings.map((listing) => (
            <AuctionCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
