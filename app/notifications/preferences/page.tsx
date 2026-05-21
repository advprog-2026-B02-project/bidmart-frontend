"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPreferences, updatePreferences } from "@/lib/notification.api";
import type {
    NotificationChannelPreference,
    NotificationPreferenceResponse,
    UpdateNotificationPreferenceRequest,
} from "@/types/notification";

// ─── Label map ────────────────────────────────────────────────────────────────

const PREF_LABELS: Record<keyof NotificationChannelPreference, { label: string; description: string }> = {
    bidPlaced:   { label: "Penawaran Ditempatkan",  description: "Notifikasi saat kamu berhasil mengajukan penawaran" },
    outbid:      { label: "Tertandinggi",           description: "Notifikasi saat penawaranmu dikalahkan pengguna lain" },
    auctionWon:  { label: "Pemenang Lelang",        description: "Notifikasi saat kamu memenangkan sebuah lelang" },
    orderUpdate: { label: "Update Pesanan",         description: "Notifikasi saat status pesananmu berubah" },
};

const PREF_KEYS = Object.keys(PREF_LABELS) as (keyof NotificationChannelPreference)[];

// ─── Toggle component ─────────────────────────────────────────────────────────

interface ToggleProps {
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-bidnavy/50
                ${checked ? "bg-bidnavy" : "bg-slate-200"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
                    ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
            />
        </button>
    );
}

// ─── Channel section ──────────────────────────────────────────────────────────

interface ChannelSectionProps {
    title: string;
    icon: string;
    values: NotificationChannelPreference;
    onChange: (key: keyof NotificationChannelPreference, val: boolean) => void;
    disabled: boolean;
}

function ChannelSection({ title, icon, values, onChange, disabled }: ChannelSectionProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <span className="text-base">{icon}</span>
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            </div>

            {/* Preference rows */}
            <div className="divide-y divide-slate-100">
                {PREF_KEYS.map((key) => (
                    <div key={key} className="flex items-center justify-between px-5 py-3.5 gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 leading-snug">
                                {PREF_LABELS[key].label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                {PREF_LABELS[key].description}
                            </p>
                        </div>
                        <Toggle
                            checked={values[key]}
                            onChange={(val) => onChange(key, val)}
                            disabled={disabled}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonSection() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
            <div className="h-12 bg-slate-100 border-b border-slate-100" />
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-slate-100 last:border-none">
                    <div className="space-y-1.5 flex-1 pr-8">
                        <div className="h-3.5 w-1/3 bg-slate-200 rounded" />
                        <div className="h-3 w-2/3 bg-slate-100 rounded" />
                    </div>
                    <div className="h-5 w-9 bg-slate-200 rounded-full" />
                </div>
            ))}
        </div>
    );
}

// ─── Toast feedback ───────────────────────────────────────────────────────────

type ToastKind = "success" | "error";

interface ToastBannerProps {
    kind: ToastKind;
    message: string;
}

function ToastBanner({ kind, message }: ToastBannerProps) {
    const base = "fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-slide-in";
    return (
        <div className={`${base} ${kind === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
            <span>{kind === "success" ? "✓" : "✕"}</span>
            {message}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationPreferencesPage() {
    const { user } = useAuth();

    const [prefs, setPrefs] = useState<NotificationPreferenceResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ kind: ToastKind; message: string } | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Track unsaved changes
    const [isDirty, setIsDirty] = useState(false);

    const showToast = (kind: ToastKind, message: string) => {
        setToast({ kind, message });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (!user) return;
        let isCancelled = false;

        const fetchAsync = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const data = await getPreferences();
                if (!isCancelled) {
                    setPrefs(data);
                    setIsLoading(false);
                }
            } catch (err) {
                if (!isCancelled) {
                    setLoadError("Gagal memuat preferensi.");
                    setIsLoading(false);
                }
                console.error(err);
            }
        };
        fetchAsync();
        return () => { isCancelled = true; };
    }, [user]);

    const handleChange = (
        channel: keyof NotificationPreferenceResponse,
        key: keyof NotificationChannelPreference,
        val: boolean
    ) => {
        setPrefs((prev) => {
            if (!prev) return prev;
            return { ...prev, [channel]: { ...prev[channel], [key]: val } };
        });
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!prefs) return;
        setIsSaving(true);

        const payload: UpdateNotificationPreferenceRequest = {
            email: { ...prefs.email },
            push: { ...prefs.push },
        };

        let isCancelled = false;
        try {
            const updated = await updatePreferences(payload);
            if (!isCancelled) {
                setPrefs(updated);
                setIsDirty(false);
                showToast("success", "Preferensi berhasil disimpan!");
            }
        } catch (err) {
            if (!isCancelled) showToast("error", "Gagal menyimpan. Coba lagi.");
            console.error(err);
        } finally {
            if (!isCancelled) setIsSaving(false);
        }

        return () => { isCancelled = true; };
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-2xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Preferensi Notifikasi</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Atur jenis notifikasi yang ingin kamu terima melalui email dan push notification.
                    </p>
                </div>

                {loadError && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                        {loadError}
                    </div>
                )}

                <div className="space-y-4">
                    {isLoading || !prefs ? (
                        <>
                            <SkeletonSection />
                            <SkeletonSection />
                        </>
                    ) : (
                        <>
                            <ChannelSection
                                title="Notifikasi Email"
                                icon="📧"
                                values={prefs.email}
                                onChange={(key, val) => handleChange("email", key, val)}
                                disabled={isSaving}
                            />
                            <ChannelSection
                                title="Push Notification"
                                icon="📲"
                                values={prefs.push}
                                onChange={(key, val) => handleChange("push", key, val)}
                                disabled={isSaving}
                            />
                        </>
                    )}
                </div>

                {/* Save button */}
                {!isLoading && prefs && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                            className="px-5 py-2 rounded-md bg-bidnavy text-white text-sm font-semibold
                                transition-all hover:bg-bidnavy/90 active:scale-[0.98]
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                )}
            </div>

            {toast && <ToastBanner kind={toast.kind} message={toast.message} />}
        </div>
    );
}