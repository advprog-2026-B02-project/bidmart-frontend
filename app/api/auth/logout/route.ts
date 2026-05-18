import { NextResponse } from 'next/server';
import { clearSession, getSession } from '@/lib/session';

export async function POST() {
    try {
        const session = await getSession();

        if (session) {
            await fetch(`${process.env.AUTH_SERVICE_URL}/auth/logout`, {
                method: 'POST',
            }).catch(e => console.error("Gagal logout di backend:", e));
        }

        await clearSession();

        return NextResponse.json({ message: "Logout berhasil" }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Gagal logout' }, { status: 500 });
    }
}