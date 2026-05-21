import { NextRequest, NextResponse } from 'next/server';
import { fetchInternal } from '@/lib/fetcher';

const EXCLUDED_HEADERS = new Set([
    'host',
    'connection',
    'content-length',
    'transfer-encoding',
    'origin',
]);

function buildHeaders(request: NextRequest): HeadersInit {
    const headers = new Headers();

    request.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();

        if (!EXCLUDED_HEADERS.has(lowerKey)) {
            headers.set(key, value);
        }
    });

    return headers;
}

export async function proxyRequest(
    request: NextRequest,
    {
        serviceUrl,
        endpoint,
    }: {
        serviceUrl: string;
        endpoint: string;
    }
) {
    try {
        const init: RequestInit = {
            method: request.method,
            headers: buildHeaders(request),
            cache: 'no-store',
        };

        if (
            request.method !== 'GET' &&
            request.method !== 'HEAD'
        ) {
            init.body = await request.text();
        }

        const response = await fetchInternal(endpoint, {
            ...init,
            serviceUrl,
        });

        const text = await response.text();

        const headers = new Headers();

        const contentType =
            response.headers.get('content-type');

        if (contentType) {
            headers.set('content-type', contentType);
        }

        const setCookie =
            response.headers.get('set-cookie');

        if (setCookie) {
            headers.set('set-cookie', setCookie);
        }

        const body = response.status === 204 || response.status === 304 ? null : text;

        return new NextResponse(body, {
            status: response.status,
            headers,
        });
    } catch (error) {
        console.error('[Proxy Error]', error);

        return NextResponse.json(
            {
                message: 'Internal proxy error',
            },
            {
                status: 500,
            }
        );
    }
}
