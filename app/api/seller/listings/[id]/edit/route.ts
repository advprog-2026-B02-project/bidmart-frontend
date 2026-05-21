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
    console.error(`[BFF PUT /api/seller/listings/${id}/edit] Error:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengedit listing." },
      { status: 500 }
    );
  }
}