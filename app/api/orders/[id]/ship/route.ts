import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const body: unknown = await request.json();

    const backendRes = await fetchInternal(`/api/v1/orders/${id}/ship`, {
      serviceUrl: ORDER_SERVICE_URL,
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (backendRes.status === 200) {
      return new NextResponse(null, { status: 200 });
    }

    const data: unknown = await backendRes.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: backendRes.status });
  } catch (error) {
    console.error(`[BFF PUT /api/orders/${id}/ship] Error:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengupdate pengiriman." },
      { status: 500 }
    );
  }
}