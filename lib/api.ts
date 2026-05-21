const BASE_URL =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8081";

type PartialLoginResponse = {
    partialToken: string;
    requires2FA: boolean;
    expiresIn: number;
};

type LoginSuccessResponse = {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: unknown;
};

export type ActiveSession = {
    id: string;
    device: string;
    ipAddress: string;
    lastActive: string;
    current: boolean;
};

export type AdminUser = {
    id: string;
    email: string;
    displayName: string;
    roles: string[];
    permissions: string[];
    status: string;
    suspended: boolean;
    enabled: boolean;
    emailVerified: boolean;
};

export type AdminRole = {
    id: string;
    name: string;
    permissions: string[];
};

export type AdminDashboardSummary = {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    verifiedUsers: number;
    activeSessions: number;
    usersByRole?: Record<string, number>;
};

export type AdminActivitySummary = {
    totalSessions?: number;
    activeSessions?: number;
    revokedSessions?: number;
    expiredSessions?: number;
    pendingTwoFactorSessions?: number;
    moderationScope?: string;
    disputeScope?: string;
    moderationActions?: string[];
    disputeResolutionActions?: string[];
    moderationEndpoint?: string;
    disputeResolutionEndpoint?: string;
    [key: string]: unknown;
};

export type AdminUserSession = {
    id: string;
    device?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
    lastActive?: string | null;
    createdAt?: string | null;
    expiresAt?: string | null;
    revoked?: boolean;
    current?: boolean;
};

function isPartialLoginResponse(data: unknown): data is PartialLoginResponse {
    if (!data || typeof data !== "object") return false;
    const response = data as Partial<Record<keyof PartialLoginResponse, unknown>>;
    return response.requires2FA === true && typeof response.partialToken === "string";
}

async function parseError(res: Response | null) {
    if (!res || res.status === 0) {
        return "Gagal terhubung ke server. Pastikan koneksi internet aktif.";
    }

    try {
        const text = await res.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch {
            if (text.includes("<html>")) return `Terjadi kesalahan pada server (Kode: ${res.status}).`;
            return text || `Permintaan gagal (Kode: ${res.status})`;
        }

        const rawMsg = data?.message || data?.error || "";

        if (rawMsg.includes("Invalid reset token") || rawMsg.includes("Invalid password token")) {
            return "Link reset tidak valid atau tidak ditemukan.";
        }

        if (rawMsg.includes("Invalid credentials") || rawMsg.includes("Bad credentials")) {
            return "Email atau kata sandi salah.";
        }
        if (rawMsg.includes("Email not found")) {
            return "Email tidak terdaftar di sistem kami.";
        }
        if (rawMsg.includes("Email already registered")) {
            return "Email sudah terdaftar. Silakan masuk atau gunakan email lain.";
        }
        if (rawMsg.includes("Token already used") && !rawMsg.includes("Reset")) {
            return "Akun Anda sudah terverifikasi. Silakan login.";
        }
        if (rawMsg.includes("Invalid token")) {
            return "Link verifikasi tidak valid atau tidak ditemukan.";
        }
        if (rawMsg.includes("Token expired")) {
            return "Link verifikasi sudah kadaluarsa.";
        }
        if (rawMsg.includes("already used")) {
            return "Link reset password ini sudah pernah digunakan.";
        }
        if (rawMsg.includes("expired")) {
            return "Link reset password sudah kadaluarsa.";
        }

        return rawMsg || `Terjadi kesalahan (Kode: ${res.status})`;
    } catch {
        return "Terjadi kesalahan sistem yang tidak terduga.";
    }
}

function setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
    }
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
        const res = await fetch(`/api/auth${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        if (res.status === 204) {
            return undefined as T;
        }

        return await res.json();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function logout() {
    if (typeof window === "undefined") return;

    await fetch("/api/auth/logout", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
    });

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
}

export async function listActiveSessions(): Promise<ActiveSession[]> {
    try {
        const res = await fetch("/api/auth/users/me/sessions", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.json();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function revokeSession(sessionId: string) {
    try {
        const res = await fetch(`/api/auth/users/me/sessions/${sessionId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function register(email: string, password: string, displayName: string, role: "BUYER" | "SELLER" = "BUYER") {
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, password, displayName, role}),
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.text();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function login(email: string, password: string) {
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, password}),
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        const data = await res.json();
        if (isPartialLoginResponse(data)) {
            return data;
        }

        const accessToken = data?.accessToken ?? data?.token ?? data?.jwt;
        const refreshToken = data?.refreshToken;

        if (!accessToken) {
            throw new Error("Login berhasil, tapi token tidak ditemukan.");
        }

        setTokens(accessToken, refreshToken);
        return data;
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function verifyTwoFactor(partialToken: string, code: string): Promise<LoginSuccessResponse> {
    try {
        const res = await fetch(`${BASE_URL}/auth/2fa/verify`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({partialToken, method: "TOTP", code}),
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        const data = await res.json();
        const accessToken = data?.accessToken ?? data?.token ?? data?.jwt;
        const refreshToken = data?.refreshToken;

        if (!accessToken) {
            throw new Error("Verifikasi 2FA berhasil, tapi token tidak ditemukan.");
        }

        setTokens(accessToken, refreshToken);
        return data;
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function me() {
    try {
        const res = await fetch("/api/auth/me", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (res.status === 401) {
            logout();
            if (typeof window !== "undefined") window.location.href = "/login";
            throw new Error("Sesi Anda telah berakhir. Silakan masuk kembali.");
        }

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.json();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function verifyEmail(token: string) {
    try {
        const res = await fetch(`/api/auth/auth/verify?token=${encodeURIComponent(token)}`, {
            method: "GET",
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.text();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function forgotPassword(email: string) {
    try {
        const res = await fetch("/api/auth/auth/forgot-password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email}),
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.text();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function resetPassword(token: string, newPass: string) {
    try {
        const res = await fetch("/api/auth/auth/reset-password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token, newPassword: newPass}),
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.text();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function validateResetToken(token: string) {
    try {
        const res = await fetch(`/api/auth/auth/reset-password/validate?token=${encodeURIComponent(token)}`, {
            method: "GET",
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return true;
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function setupTwoFactor(method: "TOTP") {
    try {
        const res = await fetch("/api/auth/auth/2fa/setup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({method}),
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.json();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function confirmTwoFactor(code: string) {
    try {
        const res = await fetch("/api/auth/auth/2fa/confirm", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({code}),
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.json();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function disableTwoFactor(password: string) {
    try {
        const res = await fetch("/api/auth/auth/2fa", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({password}),
        });

        if (!res.ok) {
            const message = await parseError(res);
            throw new Error(message);
        }

        return await res.json();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function updateProfile(displayName: string, avatarUrl: string) {
    try {
        const res = await fetch("/api/auth/me", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({displayName, avatarUrl}),
        });

        if (!res.ok) {
            const msg = await parseError(res);
            throw new Error(msg);
        }

        return await res.json();
    } catch (err: unknown) {
        if (!(err instanceof Error) || err.message === "Failed to fetch") {
            const cleanMsg = await parseError(null);
            throw new Error(cleanMsg);
        }
        throw err;
    }
}

export async function adminListUsers(filters: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    status?: string;
} = {}): Promise<AdminUser[]> {
    const params = new URLSearchParams();
    params.set("page", String(filters.page ?? 0));
    params.set("size", String(filters.size ?? 50));
    if (filters.search) params.set("search", filters.search);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);

    return adminRequest<AdminUser[]>(`/admin/users?${params.toString()}`, {
        method: "GET",
    });
}

export async function adminDashboardSummary(): Promise<AdminDashboardSummary> {
    return adminRequest<AdminDashboardSummary>("/admin/users/summary", {
        method: "GET",
    });
}

export async function adminActivitySummary(): Promise<AdminActivitySummary> {
    return adminRequest<AdminActivitySummary>("/admin/users/activity", {
        method: "GET",
    });
}

export async function adminListUserSessions(userId: string): Promise<AdminUserSession[]> {
    return adminRequest<AdminUserSession[]>(`/admin/users/${userId}/sessions`, {
        method: "GET",
    });
}

export async function adminRevokeUserSession(userId: string, sessionId: string): Promise<void> {
    return adminRequest<void>(`/admin/users/${userId}/sessions/${sessionId}`, {
        method: "DELETE",
    });
}

export async function adminGetUser(userId: string): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}`, {
        method: "GET",
    });
}

export async function adminSuspendUser(userId: string, reason: string): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/suspend`, {
        method: "PATCH",
        body: JSON.stringify({status: "SUSPENDED", reason}),
    });
}

export async function adminUnsuspendUser(userId: string): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/unsuspend`, {
        method: "PATCH",
    });
}

export async function adminUpdateUserStatus(userId: string, status: string, reason: string): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/status`, {
        method: "PUT",
        body: JSON.stringify({status, reason}),
    });
}

export async function adminUpdateUserRoles(userId: string, roles: string[], permissions?: string[]): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify({roles, permissions}),
    });
}

export async function adminAssignRole(userId: string, roleName: string): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`, {
        method: "POST",
    });
}

export async function adminRevokeRole(userId: string, roleName: string): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`, {
        method: "DELETE",
    });
}

export async function adminUpdateUserPermissions(userId: string, permissions: string[]): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({permissions}),
    });
}

export async function adminAssignPermission(userId: string, permission: string): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/permissions/${encodeURIComponent(permission)}`, {
        method: "POST",
    });
}

export async function adminRevokePermission(userId: string, permission: string): Promise<AdminUser> {
    return adminRequest<AdminUser>(`/admin/users/${userId}/permissions/${encodeURIComponent(permission)}`, {
        method: "DELETE",
    });
}

export async function adminListRoles(): Promise<AdminRole[]> {
    return adminRequest<AdminRole[]>("/admin/roles", {
        method: "GET",
    });
}

export async function adminCreateRole(name: string, permissions: string[]): Promise<AdminRole> {
    return adminRequest<AdminRole>("/admin/roles", {
        method: "POST",
        body: JSON.stringify({name, permissions}),
    });
}

export async function adminUpdateRole(roleId: string, name: string, permissions: string[]): Promise<AdminRole> {
    return adminRequest<AdminRole>(`/admin/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify({name, permissions}),
    });
}
