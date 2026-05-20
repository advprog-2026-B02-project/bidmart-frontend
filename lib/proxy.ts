import { NextRequest, NextResponse } from 'next/server';
import { fetchInternal } from '@/lib/fetcher';

const EXCLUDED_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
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

    const contentType =
      response.headers.get('content-type') || 'application/json';

    const text = await response.text();

    const nextResponse = new NextResponse(text, {
      status: response.status,
      headers: {
        'content-type': contentType,
      },
    });

    const setCookie = response.headers.get('set-cookie');

    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
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