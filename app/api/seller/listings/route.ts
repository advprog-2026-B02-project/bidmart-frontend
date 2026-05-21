import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL ?? "http://localhost:8080";
 
export async function GET(): Promise<NextResponse> {
  try {
    const backendRes = await fetchInternal("/seller/listings", {
      serviceUrl: CATALOG_SERVICE_URL,
      method: "GET",
    });
 
    const data: unknown = await backendRes.json();
 
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("[BFF GET /api/seller/listings] Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memuat daftar listing." },
      { status: 500 }
    );
  }
}
 
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
 
    const backendRes = await fetchInternal("/seller/listings/new", {
      serviceUrl: CATALOG_SERVICE_URL,
      method: "POST",
      body: JSON.stringify(body),
    });
 
    const data: unknown = await backendRes.json();
 
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("[BFF POST /api/seller/listings] Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat membuat listing baru." },
      { status: 500 }
    );
  }
}