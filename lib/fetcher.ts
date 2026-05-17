import { getSession } from './session';

type FetchOptions = RequestInit & {
    serviceUrl: string;
};

export async function fetchInternal(endpoint: string, options: FetchOptions) {
    const { serviceUrl, headers, ...restOptions } = options;

    const session = await getSession();

    const internalHeaders = new Headers(headers);
    internalHeaders.set('Content-Type', 'application/json');

    if (session) {
        internalHeaders.set('Authorization', `Bearer ${session.accessToken}`);

        internalHeaders.set('X-User-Id', session.userId);

        if (session.roles.includes('SELLER')) {
            internalHeaders.set('X-Seller-Id', session.userId);
        }
    }

    const url = `${serviceUrl}${endpoint}`;

    console.log(`[BFF] nembak internal ke: ${url}`);

    const response = await fetch(url, {
        ...restOptions,
        headers: internalHeaders,
    });

    return response;
}