import {NextResponse} from "next/server";
import {setSession} from "@/lib/session";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const res = await fetch(`${process.env.AUTH_SERVICE_URL}/auth/2fa/verify`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({error: data.message || data.error || "Verifikasi 2FA gagal"}, {status: res.status});
        }

        if (data.user?.id && data.accessToken) {
            await setSession({
                userId: data.user.id,
                accessToken: data.accessToken,
                roles: data.user.roles || [],
            });
        }

        return NextResponse.json({
            message: "Login sukses",
            user: data.user,
        }, {status: 200});
    } catch (error) {
        console.error("[BFF] 2FA Verify Error:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}
