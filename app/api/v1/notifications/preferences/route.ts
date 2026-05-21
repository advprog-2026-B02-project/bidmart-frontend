import { NextRequest, NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:8086";

export async function GET(): Promise<NextResponse> {
    const response = await fetchInternal("/api/v1/notifications/preferences", {
        serviceUrl: NOTIFICATION_SERVICE_URL,
        method: "GET",
    });

    const data: unknown = await response.json();
    return NextResponse.json(data, { status: response.status });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    const body: unknown = await request.json();

    const response = await fetchInternal("/api/v1/notifications/preferences", {
        serviceUrl: NOTIFICATION_SERVICE_URL,
        method: "PUT",
        body: JSON.stringify(body),
    });

    const data: unknown = await response.json();
    return NextResponse.json(data, { status: response.status });
}