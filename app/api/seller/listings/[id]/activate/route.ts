import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL ?? "http://localhost:8080";

const BIDDING_SERVICE_URL =
  process.env.BIDDING_SERVICE_URL ?? "http://localhost:8082";

type ActivatedListing = {
  id: string;
  startingPrice: number | string;
  reservePrice?: number | string | null;
  minimumIncrement: number | string;
  auctionEndTime?: string | null;
};

function toBiddingLocalDateTime(iso: string): string {
  return new Date(iso).toISOString().replace(/\.\d{3}Z$/, "");
}

async function startBiddingAuction(listing: ActivatedListing): Promise<void> {
  if (!listing.auctionEndTime) {
    throw new Error("Catalog tidak mengirim auctionEndTime setelah aktivasi.");
  }

  const startPrice = Number(listing.startingPrice);
  const minimumIncrement = Number(listing.minimumIncrement);
  const reservePrice =
    listing.reservePrice != null ? Number(listing.reservePrice) : startPrice;

  const backendRes = await fetchInternal(
    `/auctions/listings/${listing.id}/start`,
    {
      serviceUrl: BIDDING_SERVICE_URL,
      method: "POST",
      body: JSON.stringify({
        startPrice,
        minimumIncrement,
        reservePrice,
        endTime: toBiddingLocalDateTime(listing.auctionEndTime),
      }),
    }
  );

  if (!backendRes.ok) {
    const text = await backendRes.text();
    throw new Error(text || "Gagal membuat auction di bidding service.");
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const backendRes = await fetchInternal(
      `/seller/listings/${id}/activate`,
      {
        serviceUrl: CATALOG_SERVICE_URL,
        method: "PATCH",
      }
    );

    const data: unknown = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    await startBiddingAuction(data as ActivatedListing);

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error(
      `[BFF PATCH /api/seller/listings/${id}/activate] Error:`,
      error
    );
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengaktifkan listing." },
      { status: 500 }
    );
  }
}
