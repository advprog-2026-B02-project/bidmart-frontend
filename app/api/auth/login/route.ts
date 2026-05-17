import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const backendUrl = `${process.env.AUTH_SERVICE_URL}/auth/login`;
        const res = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: body.email,
                password: body.password
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { error: data.message || 'Gagal login bos' },
                { status: res.status }
            );
        }

        if (data.requires2FA) {
            return NextResponse.json(data, { status: 200 });
        }

        await setSessionCookie(data.accessToken, data.expiresIn);

        return NextResponse.json({
            message: "Login berhasil",
            user: data.user
        }, { status: 200 });

    } catch (error) {
        console.error("BFF Login Error:", error);
        return NextResponse.json({ error: 'Server BFF lagi ngambek' }, { status: 500 });
    }
}