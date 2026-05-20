import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

const serviceUrl = process.env.WALLET_SERVICE_URL!;

async function handleRequest(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    const endpoint =
        pathname.replace('/api/wallet', '') +
        request.nextUrl.search;

    return proxyRequest(request, {
        serviceUrl,
        endpoint,
    });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;