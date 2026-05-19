import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";
 
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.text();
 
    const backendRes = await fetchInternal(`/api/v1/orders/${params.id}/ship`, {
      serviceUrl: ORDER_SERVICE_URL,
      method: "PUT",
      body,
    });
 
    if (backendRes.status === 200) {
      return new NextResponse(null, { status: 200 });
    }
 
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[BFF /api/orders/:id/ship PUT]", err);
    return NextResponse.json(
      { message: "Gagal mengirim pesanan ke server." },
      { status: 500 }
    );
  }
}