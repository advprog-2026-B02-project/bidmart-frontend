import { NextResponse } from "next/server";
import { fetchInternal } from "@/lib/fetcher";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:8086";

export async function PUT(): Promise<NextResponse> {
    const response = await fetchInternal("/api/v1/notifications/read-all", {
        serviceUrl: NOTIFICATION_SERVICE_URL,
        method: "PUT",
    });

    if (!response.ok) {
        return NextResponse.json(
            { message: "Gagal menandai semua notifikasi" },
            { status: response.status }
        );
    }

    return new NextResponse(null, { status: 200 });
}