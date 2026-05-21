import type {
    NotificationListResponse,
    NotificationPreferenceResponse,
    UpdateNotificationPreferenceRequest,
} from "@/types/notification";

const BASE = "/api/v1/notifications";

export async function getNotifications(
    read?: boolean,
    page = 0,
    size = 20
): Promise<NotificationListResponse> {
    const params = new URLSearchParams();
    if (read !== undefined) params.set("read", String(read));
    params.set("page", String(page));
    params.set("size", String(size));

    const res = await fetch(`${BASE}?${params.toString()}`);
    if (!res.ok) throw new Error(`Gagal memuat notifikasi: ${res.status}`);
    return res.json() as Promise<NotificationListResponse>;
}

export async function markAsRead(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}/read`, { method: "PUT" });
    if (!res.ok) throw new Error(`Gagal menandai notifikasi: ${res.status}`);
}

export async function markAllAsRead(): Promise<void> {
    const res = await fetch(`${BASE}/read-all`, { method: "PUT" });
    if (!res.ok) throw new Error(`Gagal menandai semua notifikasi: ${res.status}`);
}

export async function getPreferences(): Promise<NotificationPreferenceResponse> {
    const res = await fetch(`${BASE}/preferences`);
    if (!res.ok) throw new Error(`Gagal memuat preferensi: ${res.status}`);
    return res.json() as Promise<NotificationPreferenceResponse>;
}

export async function updatePreferences(
    data: UpdateNotificationPreferenceRequest
): Promise<NotificationPreferenceResponse> {
    const res = await fetch(`${BASE}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Gagal menyimpan preferensi: ${res.status}`);
    return res.json() as Promise<NotificationPreferenceResponse>;
}