"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";
import {buttonCls, inputCls} from "@/components/ui";
import {me, updateProfile} from "@/lib/api";

export default function EditProfilePage() {
    const router = useRouter();
    const {checkSession, updateUser} = useAuth();

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [msg, setMsg] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await me();
                setDisplayName(data?.displayName || "");
                setAvatarUrl(data?.avatarUrl || "");
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Gagal memuat profil.";
                setMsg(message);
            } finally {
                setInitLoading(false);
            }
        })();
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setLoading(true);

        try {
            const updated = await updateProfile(displayName, avatarUrl);
            updateUser({
                displayName: updated?.displayName ?? displayName,
                avatarUrl: updated?.avatarUrl ?? avatarUrl,
            });
            await checkSession();
            setIsSuccess(true);
            setMsg("Profil berhasil diperbarui.");
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Gagal memperbarui profil.";
            setMsg(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-bidcream px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bidnavy/60">Account</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-bidnavy sm:text-4xl">
                        Edit Profil
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">Perbarui nama dan foto profil Anda.</p>
                </section>

                <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    {initLoading ? (
                        <div className="py-8 text-center text-sm font-semibold text-gray-500">Memuat...</div>
                    ) : (
                        <form onSubmit={onSubmit} className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-bidnavy">Nama Tampilan</label>
                                <input
                                    className={inputCls}
                                    type="text"
                                    placeholder="Contoh: John Doe"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    maxLength={100}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-bidnavy">
                                    URL Foto Profil
                                </label>
                                <input
                                    className={inputCls}
                                    type="url"
                                    placeholder="https://contoh.com/foto.jpg"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Kosongkan jika tidak ingin menggunakan foto profil.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                <button disabled={loading} className={buttonCls}>
                                    {loading ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => router.push("/me")}
                                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-bidnavy transition-colors hover:bg-bidcream disabled:opacity-60"
                                >
                                    Kembali ke Profil
                                </button>
                            </div>

                            {msg && (
                                <div
                                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                                        isSuccess
                                            ? "border-green-100 bg-green-50 text-green-700"
                                            : "border-red-100 bg-red-50 text-red-600"
                                    }`}
                                >
                                    {msg}
                                </div>
                            )}
                        </form>
                    )}
                </section>
            </div>
        </main>
    );
}
