import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const backendRes = await fetchInternal(`/api/v1/orders/${id}`, {
      serviceUrl: ORDER_SERVICE_URL,
      method: "GET",
    });

    if (backendRes.status === 404) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (backendRes.status === 403) {
      return NextResponse.json(
        { message: "Kamu tidak punya akses ke pesanan ini." },
        { status: 403 }
      );
    }

    const data: unknown = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error(`[BFF GET /api/orders/${id}] Error:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memuat detail pesanan." },
      { status: 500 }
    );
  }
}