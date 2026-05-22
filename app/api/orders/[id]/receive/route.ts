import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL ?? "http://localhost:8085";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const backendRes = await fetchInternal(`/api/v1/orders/${id}/receive`, {
      serviceUrl: ORDER_SERVICE_URL,
      method: "PUT",
    });

    if (backendRes.status === 200) {
      return new NextResponse(null, { status: 200 });
    }

    const data: unknown = await backendRes.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: backendRes.status });
  } catch (error) {
    console.error(`[BFF PUT /api/orders/${id}/receive] Error:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengkonfirmasi penerimaan." },
      { status: 500 }
    );
  }
}
