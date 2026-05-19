import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";
 
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchInternal(`/api/v1/orders/${id}`, {
      serviceUrl: ORDER_SERVICE_URL,
    });
 
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[BFF /api/orders/:id GET]", err);
    return NextResponse.json(
      { message: "Gagal mengambil detail pesanan." },
      { status: 500 }
    );
  }
}