import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:8086";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = request.nextUrl;

    const params = new URLSearchParams();
    const read = searchParams.get("read");
    const page = searchParams.get("page");
    const size = searchParams.get("size");

    if (read !== null) params.set("read", read);
    if (page !== null) params.set("page", page);
    if (size !== null) params.set("size", size);

    const query = params.toString();
    const endpoint = `/api/v1/notifications${query ? `?${query}` : ""}`;

    const response = await fetchInternal(endpoint, {
        serviceUrl: NOTIFICATION_SERVICE_URL,
        method: "GET",
    });

    const data: unknown = await response.json();
    return NextResponse.json(data, { status: response.status });
}