import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const qs = searchParams.toString();

  try {
    const backendRes = await fetchInternal(
      `/api/v1/orders${qs ? `?${qs}` : ""}`,
      {
        serviceUrl: ORDER_SERVICE_URL,
        method: "GET",
      }
    );

    const data: unknown = await backendRes.json();

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("[BFF GET /api/orders] Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memuat daftar pesanan." },
      { status: 500 }
    );
  }
}