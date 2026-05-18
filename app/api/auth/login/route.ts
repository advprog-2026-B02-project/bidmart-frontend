import { NextResponse } from 'next/server';
import { setSession } from '@/lib/session';

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
            return NextResponse.json({ error: data.message || 'Gagal login' }, { status: res.status });
        }

        if (data.requires2FA) {
            return NextResponse.json(data, { status: 200 });
        }

        await setSession({
            userId: data.user.id,
            accessToken: data.accessToken,
            roles: data.user.roles
        });

        return NextResponse.json({
            message: "Login sukses",
            user: data.user
        }, { status: 200 });

    } catch (error) {
        console.error("[BFF] Login Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}