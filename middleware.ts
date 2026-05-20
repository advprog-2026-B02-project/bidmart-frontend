import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type SessionCookie = {
    roles?: string[];
};

function canAccessAdmin(sessionCookie?: string) {
    if (!sessionCookie) return false;

    try {
        const session = JSON.parse(sessionCookie) as SessionCookie;
        return session.roles?.includes('ADMIN') === true;
    } catch {
        return false;
    }
}

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const sessionCookie = request.cookies.get('bidmart_session')?.value;
    const isAuth = !!sessionCookie;
    const isAdminRoute = path.startsWith('/admin');

    const isProtectedRoute = path.startsWith('/my-bids') ||
        path.startsWith('/checkout') ||
        path.startsWith('/seller') ||
        isAdminRoute;

    if (isProtectedRoute && !isAuth) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAdminRoute && !canAccessAdmin(sessionCookie)) {
        return NextResponse.redirect(new URL('/me', request.url));
    }

    const isAuthRoute = path === '/login' || path === '/register';
    if (isAuthRoute && isAuth) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|favicon.ico).*)',
    ],
};
