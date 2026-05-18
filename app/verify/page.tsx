"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { buttonCls } from "@/components/ui";

function VerifyNoticeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    return (
        <AuthShell
            title="Verifikasi Email"
            subtitle="Satu langkah lagi untuk mengaktifkan akun BidMart Anda."
        >
            <div className="space-y-6 text-center animate-in fade-in duration-300">
                <div className="rounded-xl bg-green-50 text-green-700 border border-green-100 px-4 py-4 text-sm font-medium leading-relaxed">
                    Akun berhasil dibuat. Kami telah mengirimkan tautan verifikasi
                    {email ? ` ke ${email}` : " ke email Anda"}.
                    Silakan cek kotak masuk atau folder spam.
                </div>

                <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className={`${buttonCls} bg-[#002447] w-full`}
                >
                    Ke Halaman Login
                </button>
            </div>
        </AuthShell>
    );
}

export default function VerifyNoticePage() {
    return (
        <Suspense fallback={<div className="text-center p-10 text-[#002447]">Memuat...</div>}>
            <VerifyNoticeContent />
        </Suspense>
    );
}