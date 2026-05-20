import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

const serviceUrl = process.env.AUTH_SERVICE_URL!;

async function handleRequest(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    let endpointPath = '';

    if (pathname === '/api/auth/me') {
        endpointPath = '/users/me';
    } else {
        const rawEndpoint = pathname.replace('/api/auth', '');

        if (rawEndpoint === '/register') {
            endpointPath = '/auth/register';
        } else if (
            rawEndpoint.startsWith('/auth/') ||
            rawEndpoint.startsWith('/users/') ||
            rawEndpoint.startsWith('/admin/')
        ) {
            endpointPath = rawEndpoint;
        } else {
            endpointPath = `/auth${rawEndpoint}`;
        }
    }

    const endpoint =
        endpointPath + request.nextUrl.search;

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