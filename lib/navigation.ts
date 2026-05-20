import type {Role} from "@/types/auth";

export type SessionLike = {
    roles?: string[];
};

export function getDefaultRoute(roles: readonly string[] = []): string {
    if (roles.includes("ADMIN")) {
        return "/admin";
    }

    if (roles.includes("SELLER")) {
        return "/seller/listings";
    }

    return "/";
}

export function canAccessSellerArea(roles: readonly string[] = []): boolean {
    return roles.includes("SELLER") || roles.includes("ADMIN");
}

export function canAccessAdminArea(roles: readonly string[] = []): boolean {
    return roles.includes("ADMIN");
}

export function normalizeRole(value: string): Role {
    return value === "SELLER" ? "SELLER" : "BUYER";
}

export function getSafeNextPath(value: string | null | undefined): string | null {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return null;
    }

    if (value.startsWith("/login") || value.startsWith("/register")) {
        return null;
    }

    return value;
}
