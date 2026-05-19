import { NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL ?? "http://localhost:8080";
 
export async function GET(): Promise<NextResponse> {
  try {
    const backendRes = await fetchInternal("/admin/categories", {
      serviceUrl: CATALOG_SERVICE_URL,
      method: "GET",
    });
 
    const data: unknown = await backendRes.json();
 
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("[BFF /api/categories] Error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar kategori." },
      { status: 500 }
    );
  }
}