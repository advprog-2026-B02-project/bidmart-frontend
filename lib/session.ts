import { cookies } from 'next/headers';

export type SessionData = {
    userId: string;
    accessToken: string;
    roles: string[];
};

const SESSION_COOKIE_NAME = 'bidmart_session';

export async function setSession(data: SessionData) {
    const cookieStore = await cookies();

    const sessionString = JSON.stringify(data);

    cookieStore.set(SESSION_COOKIE_NAME, sessionString, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 15,
    });
}

export async function getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    try {
        return JSON.parse(sessionCookie) as SessionData;
    } catch (error) {
        return null;
    }
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}