import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher"
 
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";
 
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
 
    // Teruskan query params yang relevan ke backend
    const params = new URLSearchParams();
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = searchParams.get("page") ?? "0";
    const size = searchParams.get("size") ?? "20";
 
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    params.set("page", page);
    params.set("size", size);
 
    const backendRes = await fetchInternal(
      `/api/v1/orders?${params.toString()}`,
      { serviceUrl: ORDER_SERVICE_URL }
    );
 
    const data = await backendRes.json();
 
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[BFF /api/orders GET]", err);
    return NextResponse.json(
      { message: "Gagal mengambil daftar pesanan dari server." },
      { status: 500 }
    );
  }
}