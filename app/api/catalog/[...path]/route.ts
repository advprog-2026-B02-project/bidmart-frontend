import {NextRequest, NextResponse} from "next/server";
import {fetchInternal} from "@/lib/fetcher";

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL ?? "http://localhost:8083";

async function parseResponse(response: Response): Promise<NextResponse> {
    const responseText = await response.text();

    if (!responseText) {
        return new NextResponse(null, {status: response.status});
    }

    try {
        return NextResponse.json(JSON.parse(responseText), {status: response.status});
    } catch {
        return NextResponse.json(
            {message: responseText || `Catalog request failed with status ${response.status}`},
            {status: response.status}
        );
    }
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
    const endpoint = `${request.nextUrl.pathname.replace("/api/catalog", "")}${request.nextUrl.search}`;

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "host") {
            headers[key] = value;
        }
    });

    const init: RequestInit = {
        method: request.method,
        headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = await request.text();
    }

    try {
        const response = await fetchInternal(endpoint, {
            ...init,
            serviceUrl: CATALOG_SERVICE_URL,
        });

        return parseResponse(response);
    } catch (error) {
        console.error("[BFF /api/catalog/*] Error:", error);
        return NextResponse.json(
            {message: "Terjadi kesalahan saat menghubungi catalog service."},
            {status: 502}
        );
    }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
