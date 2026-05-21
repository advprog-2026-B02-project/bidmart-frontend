import {NextRequest, NextResponse} from "next/server";
import {fetchInternal} from "@/lib/fetcher";

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL ?? "http://localhost:8086";

export async function PUT(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const {id} = await params;

    try {
        const body = await request.text();
        const backendRes = await fetchInternal(`/admin/v1/orders/${id}/dispute/resolve`, {
            serviceUrl: ORDER_SERVICE_URL,
            method: "PUT",
            body,
        });

        if (backendRes.status === 200 || backendRes.status === 204) {
            return new NextResponse(null, {status: backendRes.status});
        }

        const data: unknown = await backendRes.json().catch(() => null);
        return NextResponse.json(data ?? {}, {status: backendRes.status});
    } catch (error) {
        console.error(`[BFF PUT /api/orders/admin/${id}/dispute/resolve] Error:`, error);
        return NextResponse.json(
            {message: "Terjadi kesalahan saat menyelesaikan dispute order."},
            {status: 500}
        );
    }
}
