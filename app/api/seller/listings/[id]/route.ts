import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";
 
const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL ?? "http://localhost:8080";
 
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
 
  try {
    const body: unknown = await request.json();
 
    const backendRes = await fetchInternal(`/seller/listings/${id}/edit`, {
      serviceUrl: CATALOG_SERVICE_URL,
      method: "PUT",
      body: JSON.stringify(body),
    });
 
    const data: unknown = await backendRes.json();
 
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error(`[BFF PUT /api/seller/listings/${id}] Error:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengedit listing." },
      { status: 500 }
    );
  }
}
 
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
 
  try {
    const backendRes = await fetchInternal(`/seller/listings/${id}`, {
      serviceUrl: CATALOG_SERVICE_URL,
      method: "DELETE",
    });
 
    // Backend mengembalikan 204 No Content saat berhasil
    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
 
    const data: unknown = await backendRes.json();
 
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error(`[BFF DELETE /api/seller/listings/${id}] Error:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menghapus listing." },
      { status: 500 }
    );
  }
}