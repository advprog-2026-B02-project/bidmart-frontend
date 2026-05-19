import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL ?? "http://localhost:8080";
 
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const qs = searchParams.toString();
  const endpoint = `/catalog${qs ? `?${qs}` : ""}`;
 
  try {
    const backendRes = await fetchInternal(endpoint, {
      serviceUrl: CATALOG_SERVICE_URL,
      method: "GET",
    });
 
    const data: unknown = await backendRes.json();
 
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("[BFF /api/catalog] Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memuat katalog." },
      { status: 500 }
    );
  }
}