import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const body: unknown = await request.json();

    const backendRes = await fetchInternal(`/api/v1/orders/${id}/dispute`, {
      serviceUrl: ORDER_SERVICE_URL,
      method: "POST",
      body: JSON.stringify(body),
    });

    if (backendRes.status === 200) {
      return new NextResponse(null, { status: 200 });
    }

    const data: unknown = await backendRes.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: backendRes.status });
  } catch (error) {
    console.error(`[BFF POST /api/orders/${id}/dispute] Error:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengajukan komplain." },
      { status: 500 }
    );
  }
}