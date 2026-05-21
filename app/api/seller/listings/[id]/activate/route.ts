import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL ?? "http://localhost:8080";
 
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