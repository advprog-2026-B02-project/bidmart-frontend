"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import AuthShell from "@/components/AuthShell";
import {buttonCls, inputCls} from "@/components/ui";
import {register} from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setLoading(true);

        try {
            await register(email, password, displayName);
            router.push(`/verify?email=${encodeURIComponent(email)}`);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Gagal mendaftarkan akun.";
            setMsg(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell title="Buat Akun Baru" subtitle="Bergabunglah dengan BidMart sekarang.">
            {(
                <form onSubmit={onSubmit} className="space-y-6 animate-in fade-in duration-300">

                    {/* INPUT NAMA TAMPILAN */}
                    <div>
                        <label className="block text-lg font-medium mb-2 text-[#002447]">Nama Tampilan</label>
                        <input
                            className={inputCls}
                            type="text"
                            placeholder="Masukkan nama Anda (mis: John Doe)"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            maxLength={100}
                            disabled={loading}
                        />
                    </div>

                    {/* INPUT EMAIL */}
                    <div>
                        <label className="block text-lg font-medium mb-2 text-[#002447]">Email</label>
                        <input
                            className={inputCls}
                            type="email"
                            placeholder="Masukkan email aktif"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* INPUT PASSWORD */}
                    <div>
                        <label className="block text-lg font-medium mb-2 text-[#002447]">Kata Sandi</label>
                        <input
                            className={inputCls}
                            type="password"
                            placeholder="Minimal 8 karakter"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            disabled={loading}
                        />
                    </div>

                    <button disabled={loading} className={buttonCls}>
                        {loading ? "Mendaftar..." : "Daftar Sekarang"}
                    </button>

                    {msg && (
                        <div className="rounded-xl bg-red-50 text-red-600 border border-red-100 px-4 py-3 text-sm">
                            {msg}
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <span className="text-sm text-black/60">Sudah punya akun? </span>
                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="text-sm text-[#002447] font-medium hover:underline underline-offset-4"
                        >
                            Masuk di sini
                        </button>
                    </div>
                </form>
            )}
        </AuthShell>
    );
}
