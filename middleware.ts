import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const sessionCookie = request.cookies.get('bidmart_session')?.value;
    const isAuth = !!sessionCookie;

    const isProtectedRoute = path.startsWith('/my-bids') ||
        path.startsWith('/checkout') ||
        path.startsWith('/seller');

    if (isProtectedRoute && !isAuth) {
        return NextResponse.redirect(new URL('/login', request.url));
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