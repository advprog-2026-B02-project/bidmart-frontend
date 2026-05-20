import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL ?? "http://localhost:8083";
 
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
 
  if (!id) {
    return NextResponse.json(
      { message: "ID listing tidak valid." },
      { status: 400 }
    );
  }
 
  try {
    const backendRes = await fetchInternal(`/listings/${id}`, {
      serviceUrl: CATALOG_SERVICE_URL,
      method: "GET",
    });
 
    if (backendRes.status === 404) {
      return NextResponse.json(
        { message: "Listing tidak ditemukan." },
        { status: 404 }
      );
    }
 
    const data: unknown = await backendRes.json();
 
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error(`[BFF /api/listings/${id}] Error:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memuat detail listing." },
      { status: 500 }
    );
  }
}
