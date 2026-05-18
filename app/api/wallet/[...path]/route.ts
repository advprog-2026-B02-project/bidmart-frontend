import { NextRequest, NextResponse } from 'next/server';
import { fetchInternal } from '@/lib/fetcher';

async function handleRequest(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    const endpoint = `${pathname.replace('/api/wallet', '')}${request.nextUrl.search}`;

    const serviceUrl = process.env.WALLET_SERVICE_URL!;

    const init: RequestInit = { method: request.method };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.text();
    }

    const response = await fetchInternal(endpoint, {
        ...init,
        serviceUrl
    });

    const responseText = await response.text();
    let responseBody;
    try {
        responseBody = JSON.parse(responseText);
    } catch {
        responseBody = responseText;
    }

    return NextResponse.json(responseBody, { status: response.status });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
