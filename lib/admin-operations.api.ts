import type {ListingDetail} from "@/types/catalog";

export type AdminModerationAction = "APPROVE" | "REJECT" | "DELETE";

export type AdminModerationListing = Pick<
    ListingDetail,
    "id" | "sellerId" | "categoryName" | "title" | "status" | "currentPrice" | "createdAt"
>;

type PageResponse<T> = {
    content: T[];
};

type ResolveDisputePayload = {
    resolution: string;
    note: string;
};

export async function listAdminModerationListings(): Promise<AdminModerationListing[]> {
    const res = await fetch("/api/catalog/admin/moderation/listings?size=8&sort=createdAt,desc", {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Gagal memuat listing moderation."));
    }

    const data = await res.json() as PageResponse<AdminModerationListing>;
    return (data.content ?? [])
        .filter((listing) => listing.status !== "CLOSED")
        .slice(0, 4);
}

export async function moderateAdminListing(
    listingId: string,
    action: AdminModerationAction,
    reason: string
): Promise<AdminModerationListing> {
    const res = await fetch(`/api/catalog/admin/moderation/listings/${listingId}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action, reason}),
    });

    if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Aksi moderation listing gagal."));
    }

    return res.json() as Promise<AdminModerationListing>;
}

export async function resolveAdminDispute(orderId: string, payload: ResolveDisputePayload): Promise<void> {
    const res = await fetch(`/api/orders/admin/${orderId}/dispute/resolve`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Gagal menyelesaikan dispute order."));
    }
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
    const text = await res.text();
    if (!text) return fallback;

    try {
        const data = JSON.parse(text);
        return data?.message || data?.error || fallback;
    } catch {
        return text;
    }
}
