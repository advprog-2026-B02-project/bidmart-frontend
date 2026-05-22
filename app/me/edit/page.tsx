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
    const [shippingStreet, setShippingStreet] = useState("");
    const [shippingCity, setShippingCity] = useState("");
    const [shippingProvince, setShippingProvince] = useState("");
    const [shippingPostalCode, setShippingPostalCode] = useState("");
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
                setShippingStreet(data?.shippingStreet || "");
                setShippingCity(data?.shippingCity || "");
                setShippingProvince(data?.shippingProvince || "");
                setShippingPostalCode(data?.shippingPostalCode || "");
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
            const updated = await updateProfile({
                displayName,
                avatarUrl,
                shippingStreet,
                shippingCity,
                shippingProvince,
                shippingPostalCode,
            });
            updateUser({
                displayName: updated?.displayName ?? displayName,
                avatarUrl: updated?.avatarUrl ?? avatarUrl,
                shippingStreet: updated?.shippingStreet ?? shippingStreet,
                shippingCity: updated?.shippingCity ?? shippingCity,
                shippingProvince: updated?.shippingProvince ?? shippingProvince,
                shippingPostalCode: updated?.shippingPostalCode ?? shippingPostalCode,
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
                    <p className="mt-2 text-sm text-gray-500">
                        Perbarui nama, foto profil, dan alamat pengiriman untuk order.
                    </p>
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

                            <div className="rounded-xl border border-gray-200 bg-bidcream/50 p-4">
                                <h2 className="text-sm font-black text-bidnavy">Alamat Pengiriman</h2>
                                <p className="mt-1 text-xs font-medium text-gray-500">
                                    Alamat ini akan dipakai saat membuat order.
                                </p>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-bidnavy">
                                            Jalan / Detail Alamat
                                        </label>
                                        <input
                                            className={inputCls}
                                            type="text"
                                            placeholder="Contoh: Jl. Margonda Raya No. 1"
                                            value={shippingStreet}
                                            onChange={(e) => setShippingStreet(e.target.value)}
                                            maxLength={255}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-bidnavy">Kota</label>
                                            <input
                                                className={inputCls}
                                                type="text"
                                                placeholder="Contoh: Depok"
                                                value={shippingCity}
                                                onChange={(e) => setShippingCity(e.target.value)}
                                                maxLength={100}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-bidnavy">Provinsi</label>
                                            <input
                                                className={inputCls}
                                                type="text"
                                                placeholder="Contoh: Jawa Barat"
                                                value={shippingProvince}
                                                onChange={(e) => setShippingProvince(e.target.value)}
                                                maxLength={100}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-bidnavy">Kode Pos</label>
                                        <input
                                            className={inputCls}
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Contoh: 16424"
                                            value={shippingPostalCode}
                                            onChange={(e) => setShippingPostalCode(e.target.value)}
                                            maxLength={20}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
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
