import { NextRequest, NextResponse } from 'next/server';
import { fetchInternal } from '@/lib/fetcher';

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
            rawEndpoint.startsWith('/auth/')
            || rawEndpoint.startsWith('/users/')
            || rawEndpoint.startsWith('/admin/')
        ) {
            endpointPath = rawEndpoint;
        } else {
            endpointPath = `/auth${rawEndpoint}`;
        }
    }
    const endpoint = `${endpointPath}${request.nextUrl.search}`;

    const serviceUrl = process.env.AUTH_SERVICE_URL!;

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'host') {
            headers[key] = value;
        }
    });

    const init: RequestInit = {
        method: request.method,
        headers: headers
    };

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

    const nextResponse = NextResponse.json(responseBody, { status: response.status });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
        nextResponse.headers.set('Set-Cookie', setCookieHeader);
    }

    return nextResponse;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
