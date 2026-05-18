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

function isPartialLoginResponse(data: unknown): data is PartialLoginResponse {
    const value = data as Partial<Record<keyof PartialLoginResponse, unknown>>;
    return value.requires2FA === true && typeof value.partialToken === "string";
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

        if (rawMsg.includes("already used")) {
            return "Link reset password ini sudah pernah digunakan.";
        }
        if (rawMsg.includes("expired")) {
            return "Link reset password sudah kadaluarsa.";
        }
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

        return rawMsg || `Terjadi kesalahan (Kode: ${res.status})`;
    } catch {
        return "Terjadi kesalahan sistem yang tidak terduga.";
    }
}

function getAccessToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
}

function getRefreshToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
}

function setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
    }
}

function authHeaders() {
    const token = getAccessToken();
    if (!token) {
        throw new Error("Sesi tidak ditemukan, silakan login ulang.");
    }

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: {
                ...authHeaders(),
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

    const refreshToken = getRefreshToken();

    if (refreshToken) {
        try {
            await fetch(`${BASE_URL}/auth/logout`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({refreshToken}),
            });
        } catch (e) {
            throw e; // just throw it
        }
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
}

export async function listActiveSessions(): Promise<ActiveSession[]> {
    try {
        const token = getAccessToken();
        if (!token) {
            throw new Error("Sesi tidak ditemukan, silakan login ulang.");
        }

        const res = await fetch(`${BASE_URL}/users/me/sessions`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
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
        const token = getAccessToken();
        if (!token) {
            throw new Error("Sesi tidak ditemukan, silakan login ulang.");
        }

        const res = await fetch(`${BASE_URL}/users/me/sessions/${sessionId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
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

export async function register(email: string, password: string, displayName: string) {
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, password, displayName}),
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
        const accessToken = getAccessToken();
        const res = await fetch(`${BASE_URL}/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
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
        const res = await fetch(`${BASE_URL}/auth/verify?token=${token}`, {
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
        const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
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
        const res = await fetch(`${BASE_URL}/auth/reset-password`, {
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
        const res = await fetch(`${BASE_URL}/auth/reset-password/validate?token=${token}`, {
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
        const token = getAccessToken();
        if (!token) {
            throw new Error("Sesi tidak ditemukan, silakan login ulang.");
        }

        const res = await fetch(`${BASE_URL}/auth/2fa/setup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
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
        const token = getAccessToken();
        if (!token) {
            throw new Error("Sesi tidak ditemukan, silakan login ulang.");
        }

        const res = await fetch(`${BASE_URL}/auth/2fa/confirm`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
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
        const token = getAccessToken();
        if (!token) {
            throw new Error("Sesi tidak ditemukan, silakan login ulang.");
        }

        const res = await fetch(`${BASE_URL}/auth/2fa`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
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
        const token = getAccessToken();

        if (!token) {
            throw new Error("Sesi tidak ditemukan, silakan login ulang.");
        }

        const res = await fetch(`${BASE_URL}/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
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
