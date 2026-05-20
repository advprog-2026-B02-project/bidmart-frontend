import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {canAccessAdminArea, canAccessSellerArea, getDefaultRoute} from '@/lib/navigation';

type SessionCookie = {
    userId?: string;
    roles?: string[];
};

function readSessionCookie(rawValue: string | undefined): SessionCookie | null {
    if (!rawValue) return null;

    try {
        return JSON.parse(rawValue) as SessionCookie;
    } catch {
        try {
            return JSON.parse(decodeURIComponent(rawValue)) as SessionCookie;
        } catch {
            return null;
        }
    }
}

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const nextPath = `${path}${request.nextUrl.search}`;

    const session = readSessionCookie(request.cookies.get('bidmart_session')?.value);
    const roles = session?.roles ?? [];
    const isAuth = !!session?.userId;

    const isProtectedRoute =
        path === '/' ||
        path.startsWith('/catalog') ||
        path.startsWith('/auctions') ||
        path.startsWith('/wallet') ||
        path.startsWith('/orders') ||
        path.startsWith('/notifications') ||
        path.startsWith('/me') ||
        path.startsWith('/profile') ||
        path.startsWith('/seller') ||
        path.startsWith('/admin');

    if (isProtectedRoute && !isAuth) {
        const loginUrl = new URL('/login', request.url);
        if (path !== '/') {
            loginUrl.searchParams.set('next', nextPath);
        }
        return NextResponse.redirect(loginUrl);
    }

    if (path.startsWith('/seller') && !canAccessSellerArea(roles)) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (path.startsWith('/admin') && !canAccessAdminArea(roles)) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const isAuthRoute = path === '/login' || path === '/register' || path === '/login/2fa';
    if (isAuthRoute && isAuth) {
        return NextResponse.redirect(new URL(getDefaultRoute(roles), request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|favicon.ico).*)',
    ],
};
