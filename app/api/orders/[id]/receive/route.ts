import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";
 
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchInternal(
      `/api/v1/orders/${id}/receive`,
      {
        serviceUrl: ORDER_SERVICE_URL,
        method: "PUT",
      }
    );
 
    if (backendRes.status === 200) {
      return new NextResponse(null, { status: 200 });
    }
 
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[BFF /api/orders/:id/receive PUT]", err);
    return NextResponse.json(
      { message: "Gagal mengkonfirmasi penerimaan pesanan." },
      { status: 500 }
    );
  }
}