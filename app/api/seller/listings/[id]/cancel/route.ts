import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL ?? "http://localhost:8080";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const backendRes = await fetchInternal(
      `/seller/listings/${id}/cancel`,
      {
        serviceUrl: CATALOG_SERVICE_URL,
        method: "PATCH",
      }
    );

    // Backend returns 204 No Content — jangan panggil .json()
    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // Error response mungkin punya body (misal 409)
    const data: unknown = await backendRes.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: backendRes.status });
  } catch (error) {
    console.error(
      `[BFF PATCH /api/seller/listings/${id}/cancel] Error:`,
      error
    );
    return NextResponse.json(
      { message: "Terjadi kesalahan saat membatalkan listing." },
      { status: 500 }
    );
  }
}