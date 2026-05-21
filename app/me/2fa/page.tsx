"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {buttonCls, inputCls} from "@/components/ui";
import {confirmTwoFactor, disableTwoFactor, setupTwoFactor} from "@/lib/api";

export default function TwoFactorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    const [totpSecret, setTotpSecret] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const [disablePassword, setDisablePassword] = useState("");

    async function startTotpSetup() {
        setLoading(true);
        setMsg(null);
        setIsError(false);

        try {
            const data = await setupTwoFactor("TOTP");
            setTotpSecret(data?.secret || null);
            setMsg("Setup TOTP dimulai. Masukkan key ke aplikasi authenticator lalu konfirmasi.");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Gagal memulai setup TOTP.";
            setIsError(true);
            setMsg(message);
        } finally {
            setLoading(false);
        }
    }

    async function confirmTotp() {
        setLoading(true);
        setMsg(null);
        setIsError(false);

        try {
            await confirmTwoFactor(totpCode);
            setTotpCode("");
            setMsg("2FA TOTP berhasil diaktifkan.");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Gagal konfirmasi TOTP.";
            setIsError(true);
            setMsg(message);
        } finally {
            setLoading(false);
        }
    }

    async function disable2FA() {
        setLoading(true);
        setMsg(null);
        setIsError(false);

        try {
            await disableTwoFactor(disablePassword);
            setDisablePassword("");
            setTotpSecret(null);
            setTotpCode("");
            setMsg("2FA berhasil dinonaktifkan.");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Gagal menonaktifkan 2FA.";
            setIsError(true);
            setMsg(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-bidcream px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bidnavy/60">Security</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight text-bidnavy sm:text-4xl">
                            Kelola 2FA
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Atur metode two-factor authentication untuk akun Anda.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/me")}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-bidnavy shadow-sm hover:bg-bidcream"
                    >
                        Kembali ke Profil
                    </button>
                </section>

                <section className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <button
                        disabled={loading}
                        className="w-full rounded-xl bg-bidnavy px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-bidnavy2 disabled:opacity-60"
                        onClick={startTotpSetup}
                    >
                        {loading ? "Memproses..." : "Mulai Setup 2FA TOTP"}
                    </button>

                    {totpSecret && (
                        <div className="space-y-4 rounded-xl border border-gray-200 bg-bidcream/60 p-4">
                            <div>
                                <p className="text-sm font-bold text-bidnavy">Key TOTP</p>
                                <p className="mt-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-gray-700">
                                    {totpSecret}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-bidnavy">Kode TOTP</label>
                                <input
                                    className={inputCls}
                                    placeholder="Masukkan kode dari authenticator"
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <button disabled={loading || !totpCode} className={buttonCls} onClick={confirmTotp}>
                                Konfirmasi TOTP
                            </button>
                        </div>
                    )}

                    <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-bold text-red-700">Nonaktifkan 2FA</p>
                        <input
                            className={inputCls}
                            type="password"
                            placeholder="Masukkan password akun"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            disabled={loading || !disablePassword}
                            className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                            onClick={disable2FA}
                        >
                            Nonaktifkan 2FA
                        </button>
                    </div>

                    {msg && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                                isError ? "border-red-100 bg-red-50 text-red-600" : "border-green-100 bg-green-50 text-green-700"
                            }`}
                        >
                            {msg}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
