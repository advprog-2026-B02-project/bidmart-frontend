import { cookies } from 'next/headers';

export async function setSessionCookie(accessToken: string, expiresIn: number) {
    const cookieStore = await cookies();

    cookieStore.set('session_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn,
        path: '/',
    });
}

export async function getUserIdFromSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) return null;

    try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const decoded = JSON.parse(decodedJson);

        return decoded.id || decoded.sub || null;
    } catch (e) {
        console.error("Gagal decode JWT di BFF:", e);
        return null;
    }
}