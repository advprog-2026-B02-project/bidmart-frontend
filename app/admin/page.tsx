"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {
    AdminModerationAction,
    AdminModerationListing,
    listAdminModerationListings,
    moderateAdminListing,
    resolveAdminDispute,
} from "@/lib/admin-operations.api";
import {
    AdminActivitySummary,
    AdminDashboardSummary,
    AdminRole,
    AdminUser,
    AdminUserSession,
    adminAssignPermission,
    adminAssignRole,
    adminActivitySummary,
    adminCreateRole,
    adminDashboardSummary,
    adminListUserSessions,
    adminListRoles,
    adminListUsers,
    adminRevokePermission,
    adminRevokeRole,
    adminRevokeUserSession,
    adminSuspendUser,
    adminUnsuspendUser,
    adminUpdateRole,
    adminUpdateUserPermissions,
    adminUpdateUserRoles,
    adminUpdateUserStatus,
} from "@/lib/api";

type Message = {
    type: "success" | "error";
    text: string;
};

const statusOptions = ["", "ACTIVE", "SUSPENDED"];

export default function AdminDashboardPage() {
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<AdminRole[]>([]);
    const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
    const [activitySummary, setActivitySummary] = useState<AdminActivitySummary | null>(null);
    const [userSessions, setUserSessions] = useState<AdminUserSession[]>([]);
    const [moderationListings, setModerationListings] = useState<AdminModerationListing[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [newRole, setNewRole] = useState("");
    const [newPermission, setNewPermission] = useState("");
    const [replaceRoles, setReplaceRoles] = useState("");
    const [replacePermissions, setReplacePermissions] = useState("");
    const [statusValue, setStatusValue] = useState("ACTIVE");
    const [suspendReason, setSuspendReason] = useState("");
    const [moderationReason, setModerationReason] = useState("");
    const [disputeOrderId, setDisputeOrderId] = useState("");
    const [disputeResolution, setDisputeResolution] = useState("REFUND_BUYER");
    const [disputeNote, setDisputeNote] = useState("");
    const [roleName, setRoleName] = useState("");
    const [rolePermissions, setRolePermissions] = useState("");
    const [loading, setLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [moderationLoading, setModerationLoading] = useState(false);
    const [action, setAction] = useState<string | null>(null);
    const [message, setMessage] = useState<Message | null>(null);

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId) || null,
        [selectedUserId, users]
    );

    const stats = useMemo(() => {
        const active = users.filter((user) => user.status === "ACTIVE").length;
        const suspended = users.filter((user) => user.suspended || user.status === "SUSPENDED").length;
        const admins = users.filter((user) => user.roles?.includes("ADMIN")).length;
        const verified = users.filter((user) => user.emailVerified).length;
        const summaryRoles = summary?.usersByRole || {};

        return {
            active: summary?.activeUsers ?? active,
            admins: getRoleCount(summaryRoles, "ADMIN") ?? admins,
            buyers: getRoleCount(summaryRoles, "BUYER") ?? users.filter((user) => user.roles?.includes("BUYER")).length,
            sellers: getRoleCount(summaryRoles, "SELLER") ?? users.filter((user) => user.roles?.includes("SELLER")).length,
            suspended: summary?.suspendedUsers ?? suspended,
            total: summary?.totalUsers ?? users.length,
            unverified: summary ? Math.max(summary.totalUsers - summary.verifiedUsers, 0) : users.length - verified,
            verified: summary?.verifiedUsers ?? verified,
        };
    }, [summary, users]);

    function selectUser(user: AdminUser | null) {
        setSelectedUserId(user?.id || null);
        setReplaceRoles((user?.roles || []).join(", "));
        setReplacePermissions((user?.permissions || []).join(", "));
        setStatusValue(user?.status || "ACTIVE");
    }

    function selectRole(role: AdminRole | null) {
        setSelectedRoleId(role?.id || null);
        setRoleName(role?.name || "");
        setRolePermissions((role?.permissions || []).join(", "));
    }

    async function loadData() {
        setLoading(true);
        setMessage(null);

        try {
            const [userData, roleData] = await Promise.all([
                adminListUsers({
                    search: search.trim(),
                    role: roleFilter.trim(),
                    status: statusFilter,
                    size: 100,
                }),
                adminListRoles(),
            ]);
            const [summaryData, activityData] = await Promise.all([
                adminDashboardSummary(),
                adminActivitySummary(),
            ]);
            setUsers(userData);
            setRoles(roleData);
            setSummary(summaryData);
            setActivitySummary(activityData);
            selectUser((selectedUserId && userData.find((user) => user.id === selectedUserId)) || userData[0] || null);
            selectRole((selectedRoleId && roleData.find((role) => role.id === selectedRoleId)) || null);
            void Promise.resolve().then(loadModerationListings);
        } catch (err: unknown) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Gagal memuat data admin.",
            });
        } finally {
            setLoading(false);
        }
    }

    async function loadModerationListings() {
        setModerationLoading(true);

        try {
            setModerationListings(await listAdminModerationListings());
        } catch (err: unknown) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Gagal memuat listing moderation.",
            });
        } finally {
            setModerationLoading(false);
        }
    }

    async function loadUserSessions(userId: string) {
        setSessionsLoading(true);

        try {
            setUserSessions(await adminListUserSessions(userId));
        } catch (err: unknown) {
            setUserSessions([]);
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Gagal memuat sesi user.",
            });
        } finally {
            setSessionsLoading(false);
        }
    }

    function applyUserUpdate(updated: AdminUser) {
        setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
        setSelectedUserId(updated.id);
    }

    async function runUserAction(label: string, task: () => Promise<AdminUser>) {
        setAction(label);
        setMessage(null);

        try {
            const updated = await task();
            applyUserUpdate(updated);
            setMessage({type: "success", text: "Perubahan user tersimpan."});
        } catch (err: unknown) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Aksi admin gagal.",
            });
        } finally {
            setAction(null);
        }
    }

    async function runRoleAction(label: string, task: () => Promise<AdminRole>) {
        setAction(label);
        setMessage(null);

        try {
            const role = await task();
            setRoles((current) => {
                const exists = current.some((item) => item.id === role.id);
                return exists ? current.map((item) => item.id === role.id ? role : item) : [...current, role];
            });
            setSelectedRoleId(role.id);
            setRoleName(role.name);
            setRolePermissions(role.permissions.join(", "));
            setMessage({type: "success", text: "Perubahan role tersimpan."});
        } catch (err: unknown) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Aksi role gagal.",
            });
        } finally {
            setAction(null);
        }
    }

    async function runModerationAction(listingId: string, moderationAction: AdminModerationAction) {
        setAction(`moderate-${moderationAction}-${listingId}`);
        setMessage(null);

        try {
            await moderateAdminListing(listingId, moderationAction, moderationReason);
            setModerationListings((current) => current.filter((listing) => listing.id !== listingId));
            setMessage({
                type: "success",
                text: moderationAction === "APPROVE"
                    ? "Listing berhasil di-approve dan keluar dari queue moderation."
                    : "Listing berhasil dihapus dari katalog.",
            });
        } catch (err: unknown) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Aksi moderation listing gagal.",
            });
        } finally {
            setAction(null);
        }
    }

    async function runResolveDispute() {
        if (!disputeOrderId.trim()) {
            setMessage({type: "error", text: "Masukkan ID order yang sedang dispute."});
            return;
        }

        setAction("resolve-dispute");
        setMessage(null);

        try {
            await resolveAdminDispute(disputeOrderId.trim(), {
                resolution: disputeResolution,
                note: disputeNote,
            });
            setDisputeOrderId("");
            setDisputeNote("");
            setMessage({type: "success", text: "Dispute order berhasil diselesaikan."});
        } catch (err: unknown) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Gagal menyelesaikan dispute order.",
            });
        } finally {
            setAction(null);
        }
    }

    async function revokeSelectedSession(sessionId: string) {
        if (!selectedUserId) return;
        setAction(`revoke-session-${sessionId}`);
        setMessage(null);

        try {
            await adminRevokeUserSession(selectedUserId, sessionId);
            await loadUserSessions(selectedUserId);
            setMessage({type: "success", text: "Sesi user berhasil dicabut."});
        } catch (err: unknown) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Gagal mencabut sesi user.",
            });
        } finally {
            setAction(null);
        }
    }

    useEffect(() => {
        void Promise.resolve().then(loadData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedUserId) {
            void Promise.resolve().then(() => setUserSessions([]));
            return;
        }

        void Promise.resolve().then(() => loadUserSessions(selectedUserId));
    }, [selectedUserId]);

    return (
        <main className="min-h-screen bg-[#f6f4ef] text-[#102033]">
            <header className="border-b border-black/10 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#006c67]">BidMart Admin</p>
                        <h1 className="mt-1 text-3xl font-semibold text-[#002447]">Dashboard Admin</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            className="rounded-md border border-[#002447]/20 bg-white px-4 py-2 text-sm font-semibold text-[#002447] disabled:opacity-60"
                        >
                            {loading ? "Memuat..." : "Refresh"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/me")}
                            className="rounded-md bg-[#002447] px-4 py-2 text-sm font-semibold text-white"
                        >
                            Profil
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6">
                {message && (
                    <div
                        className={`rounded-md border px-4 py-3 text-sm ${
                            message.type === "error"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-700"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <section className="grid gap-3 md:grid-cols-4">
                    <Stat label="Total user" value={stats.total}/>
                    <Stat label="Aktif" value={stats.active}/>
                    <Stat label="Suspended" value={stats.suspended}/>
                    <Stat label="Verified" value={stats.verified}/>
                    <Stat label="Unverified" value={stats.unverified}/>
                    <Stat label="Admin" value={stats.admins}/>
                    <Stat label="Seller" value={stats.sellers}/>
                    <Stat label="Buyer" value={stats.buyers}/>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
                    <div className="rounded-md border border-black/10 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Security summary</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <MiniStat label="Active sessions" value={activitySummary?.activeSessions ?? summary?.activeSessions ?? 0}/>
                            <MiniStat label="Revoked sessions" value={activitySummary?.revokedSessions ?? 0}/>
                            <MiniStat label="Expired sessions" value={activitySummary?.expiredSessions ?? 0}/>
                            <MiniStat label="Pending 2FA" value={activitySummary?.pendingTwoFactorSessions ?? 0}/>
                        </div>
                    </div>

                    <div className="rounded-md border border-black/10 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Admin activity scope</p>
                        <div className="mt-3 grid gap-3 xl:grid-cols-[0.55fr_1.4fr_1fr]">
                            <MiniStat label="Total sesi terlacak" value={activitySummary?.totalSessions ?? "-"}/>

                            <div className="rounded-md border border-[#002447]/10 bg-[#f6f4ef] p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#002447]">Listing moderation</p>
                                        <p className="mt-1 text-xs text-black/55">
                                            {activitySummary?.moderationScope || "Catalog service owns listing moderation execution."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={loadModerationListings}
                                        disabled={moderationLoading}
                                        className="rounded-md border border-[#002447]/20 px-3 py-2 text-xs font-semibold text-[#002447] disabled:opacity-60"
                                    >
                                        {moderationLoading ? "Memuat..." : "Refresh"}
                                    </button>
                                </div>

                                <input
                                    value={moderationReason}
                                    onChange={(event) => setModerationReason(event.target.value)}
                                    className="mt-3 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#006c67]"
                                    placeholder="Catatan moderation untuk approve/reject/delete"
                                />

                                <div className="mt-3 space-y-2">
                                    {moderationListings.length === 0 ? (
                                        <p className="rounded-md bg-white px-3 py-3 text-xs text-black/45">
                                            Tidak ada listing yang perlu ditampilkan.
                                        </p>
                                    ) : (
                                        moderationListings.map((listing) => (
                                            <div key={listing.id} className="rounded-md bg-white p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-[#002447]">{listing.title}</p>
                                                        <p className="mt-1 text-xs text-black/45">
                                                            {listing.status} · {listing.categoryName || "Tanpa kategori"}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-black/45">
                                                        {formatRupiah(listing.currentPrice)}
                                                    </span>
                                                </div>
                                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                                    {getListingActions(listing, activitySummary).map((item) => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            disabled={action !== null}
                                                            onClick={() => runModerationAction(listing.id, item)}
                                                            className={`rounded-md px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                                                                item === "DELETE"
                                                                    ? "border border-red-200 text-red-700 hover:bg-red-50"
                                                                    : "bg-[#002447] text-white hover:bg-[#003b70]"
                                                            }`}
                                                        >
                                                            {action === `moderate-${item}-${listing.id}`
                                                                ? "Memproses..."
                                                                : item === "DELETE" ? "Delete dari katalog" : "Approve"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-md border border-[#002447]/10 bg-[#f6f4ef] p-3">
                                <p className="text-sm font-semibold text-[#002447]">Dispute support</p>
                                <p className="mt-1 text-xs text-black/55">
                                    {activitySummary?.disputeScope || "Order service owns dispute execution."}
                                </p>
                                <div className="mt-3 space-y-2">
                                    <input
                                        value={disputeOrderId}
                                        onChange={(event) => setDisputeOrderId(event.target.value)}
                                        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#006c67]"
                                        placeholder="Order ID yang statusnya DISPUTED"
                                    />
                                    <select
                                        value={disputeResolution}
                                        onChange={(event) => setDisputeResolution(event.target.value)}
                                        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#006c67]"
                                    >
                                        {getDisputeActions(activitySummary).map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                    <textarea
                                        value={disputeNote}
                                        onChange={(event) => setDisputeNote(event.target.value)}
                                        className="min-h-20 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#006c67]"
                                        placeholder="Catatan keputusan admin"
                                    />
                                    <button
                                        type="button"
                                        onClick={runResolveDispute}
                                        disabled={action !== null}
                                        className="w-full rounded-md bg-[#002447] px-3 py-2 text-xs font-semibold text-white hover:bg-[#003b70] disabled:opacity-60"
                                    >
                                        {action === "resolve-dispute" ? "Menyelesaikan..." : "Resolve Dispute"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
                    <div className="rounded-md border border-black/10 bg-white">
                        <div className="border-b border-black/10 px-4 py-4">
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                    placeholder="Cari email atau nama"
                                />
                                <input
                                    value={roleFilter}
                                    onChange={(event) => setRoleFilter(event.target.value.toUpperCase())}
                                    className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                    placeholder="Role"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                >
                                    <option value="">Semua status</option>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="SUSPENDED">SUSPENDED</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={loadData}
                                    disabled={loading}
                                    className="rounded-md bg-[#006c67] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    Filter
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-[#002447]/5 text-xs uppercase tracking-wide text-black/50">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Roles</th>
                                    <th className="px-4 py-3">Permissions</th>
                                    <th className="px-4 py-3">Email</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        onClick={() => selectUser(user)}
                                        className={`cursor-pointer border-t border-black/5 hover:bg-[#006c67]/5 ${
                                            selectedUserId === user.id ? "bg-[#006c67]/10" : ""
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-[#002447]">{user.displayName || "-"}</div>
                                            <div className="text-xs text-black/50">{user.id}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={user.status}/>
                                        </td>
                                        <td className="px-4 py-3">
                                            <TokenList values={user.roles}/>
                                        </td>
                                        <td className="px-4 py-3">
                                            <TokenList values={user.permissions}/>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{user.email}</div>
                                            <div className="text-xs text-black/50">
                                                {user.emailVerified ? "Verified" : "Unverified"}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-black/50" colSpan={5}>
                                            Tidak ada user.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <section className="rounded-md border border-black/10 bg-white p-4">
                            <h2 className="text-lg font-semibold text-[#002447]">User Terpilih</h2>
                            {selectedUser ? (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <p className="font-semibold">{selectedUser.displayName || "-"}</p>
                                        <p className="text-sm text-black/60">{selectedUser.email}</p>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => runUserAction("suspend", () => adminSuspendUser(selectedUser.id, suspendReason))}
                                            disabled={action !== null || selectedUser.suspended}
                                            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-black/20"
                                        >
                                            Suspend
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => runUserAction("unsuspend", () => adminUnsuspendUser(selectedUser.id))}
                                            disabled={action !== null || !selectedUser.suspended}
                                            className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-black/20"
                                        >
                                            Unsuspend
                                        </button>
                                    </div>
                                    <input
                                        value={suspendReason}
                                        onChange={(event) => setSuspendReason(event.target.value)}
                                        className="w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                        placeholder="Alasan suspend"
                                    />

                                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                        <select
                                            value={statusValue}
                                            onChange={(event) => setStatusValue(event.target.value)}
                                            className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                        >
                                            {statusOptions.filter(Boolean).map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => runUserAction("status", () => adminUpdateUserStatus(selectedUser.id, statusValue, suspendReason))}
                                            disabled={action !== null}
                                            className="rounded-md bg-[#002447] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                        >
                                            Set Status
                                        </button>
                                    </div>

                                    <AdminTextArea
                                        label="Replace roles"
                                        value={replaceRoles}
                                        onChange={setReplaceRoles}
                                        placeholder="ADMIN, SELLER"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => runUserAction("replace-roles", () => adminUpdateUserRoles(selectedUser.id, splitList(replaceRoles)))}
                                        disabled={action !== null}
                                        className="w-full rounded-md bg-[#006c67] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        Simpan Roles
                                    </button>

                                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                                        <input
                                            value={newRole}
                                            onChange={(event) => setNewRole(event.target.value.toUpperCase())}
                                            className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                            placeholder="Role"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => runUserAction("assign-role", () => adminAssignRole(selectedUser.id, newRole))}
                                            disabled={action !== null || !newRole.trim()}
                                            className="rounded-md bg-[#002447] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                        >
                                            Assign
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => runUserAction("revoke-role", () => adminRevokeRole(selectedUser.id, newRole))}
                                            disabled={action !== null || !newRole.trim()}
                                            className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                                        >
                                            Revoke
                                        </button>
                                    </div>

                                    <AdminTextArea
                                        label="Replace permissions"
                                        value={replacePermissions}
                                        onChange={setReplacePermissions}
                                        placeholder="PRODUCT_CREATE, PRODUCT_UPDATE"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => runUserAction("replace-permissions", () => adminUpdateUserPermissions(selectedUser.id, splitList(replacePermissions)))}
                                        disabled={action !== null}
                                        className="w-full rounded-md bg-[#006c67] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        Simpan Permissions
                                    </button>

                                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                                        <input
                                            value={newPermission}
                                            onChange={(event) => setNewPermission(event.target.value.toUpperCase())}
                                            className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                            placeholder="Permission"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => runUserAction("assign-permission", () => adminAssignPermission(selectedUser.id, newPermission))}
                                            disabled={action !== null || !newPermission.trim()}
                                            className="rounded-md bg-[#002447] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                        >
                                            Assign
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => runUserAction("revoke-permission", () => adminRevokePermission(selectedUser.id, newPermission))}
                                            disabled={action !== null || !newPermission.trim()}
                                            className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-black/50">Pilih user dari tabel.</p>
                            )}
                        </section>

                        <section className="rounded-md border border-black/10 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold text-[#002447]">User Sessions</h2>
                                <button
                                    type="button"
                                    onClick={() => selectedUserId && loadUserSessions(selectedUserId)}
                                    disabled={!selectedUserId || sessionsLoading}
                                    className="rounded-md border border-[#002447]/20 px-3 py-2 text-xs font-semibold text-[#002447] disabled:opacity-60"
                                >
                                    {sessionsLoading ? "Memuat..." : "Refresh"}
                                </button>
                            </div>

                            {!selectedUser ? (
                                <p className="mt-4 text-sm text-black/50">Pilih user untuk melihat sesi.</p>
                            ) : sessionsLoading ? (
                                <p className="mt-4 text-sm text-black/50">Memuat sesi user...</p>
                            ) : userSessions.length === 0 ? (
                                <p className="mt-4 rounded-md bg-[#002447]/5 px-3 py-3 text-sm text-black/50">
                                    Tidak ada sesi untuk user ini.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {userSessions.map((session) => (
                                        <div key={session.id} className="rounded-md border border-black/10 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-[#002447]">
                                                        {session.device || session.userAgent || "Unknown device"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-black/50">
                                                        IP {session.ipAddress || "-"}
                                                    </p>
                                                </div>
                                                <StatusBadge status={session.revoked ? "SUSPENDED" : session.current ? "ACTIVE" : "ACTIVE"}/>
                                            </div>

                                            <dl className="mt-3 grid gap-2 text-xs text-black/55 sm:grid-cols-2">
                                                <SessionMeta label="Created" value={formatDate(session.createdAt)}/>
                                                <SessionMeta label="Last active" value={formatDate(session.lastActive)}/>
                                                <SessionMeta label="Expires" value={formatDate(session.expiresAt)}/>
                                                <SessionMeta label="Revoked" value={session.revoked ? "Yes" : "No"}/>
                                            </dl>

                                            <button
                                                type="button"
                                                disabled={action !== null || session.revoked}
                                                onClick={() => revokeSelectedSession(session.id)}
                                                className="mt-3 w-full rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:bg-black/5 disabled:text-black/30"
                                            >
                                                {action === `revoke-session-${session.id}` ? "Mencabut..." : "Revoke Session"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-md border border-black/10 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold text-[#002447]">Roles</h2>
                                <select
                                    value={selectedRoleId || ""}
                                    onChange={(event) => selectRole(roles.find((role) => role.id === event.target.value) || null)}
                                    className="max-w-[190px] rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                >
                                    <option value="">Role baru</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4 space-y-3">
                                <input
                                    value={roleName}
                                    onChange={(event) => setRoleName(event.target.value.toUpperCase())}
                                    className="w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                                    placeholder="Nama role"
                                />
                                <AdminTextArea
                                    label="Permissions role"
                                    value={rolePermissions}
                                    onChange={setRolePermissions}
                                    placeholder="PRODUCT_CREATE, PRODUCT_UPDATE"
                                />
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => runRoleAction("create-role", () => adminCreateRole(roleName, splitList(rolePermissions)))}
                                        disabled={action !== null || !roleName.trim()}
                                        className="rounded-md bg-[#006c67] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        Create Role
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectedRoleId && runRoleAction("update-role", () => adminUpdateRole(selectedRoleId, roleName, splitList(rolePermissions)))}
                                        disabled={action !== null || !selectedRoleId || !roleName.trim()}
                                        className="rounded-md bg-[#002447] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        Update Role
                                    </button>
                                </div>
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </main>
    );
}

function Stat({label, value}: { label: string; value: number }) {
    return (
        <div className="rounded-md border border-black/10 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#002447]">{value}</p>
        </div>
    );
}

function MiniStat({label, value}: { label: string; value: number | string }) {
    return (
        <div className="rounded-md bg-[#002447]/5 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</p>
            <p className="mt-1 text-lg font-semibold text-[#002447]">{value}</p>
        </div>
    );
}

function StatusBadge({status}: { status: string }) {
    const suspended = status === "SUSPENDED";
    return (
        <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
        >
            {status || "ACTIVE"}
        </span>
    );
}

function SessionMeta({label, value}: { label: string; value: string }) {
    return (
        <div>
            <dt className="font-semibold uppercase tracking-wide text-black/35">{label}</dt>
            <dd className="mt-0.5 text-black/65">{value}</dd>
        </div>
    );
}

function TokenList({values}: { values?: string[] }) {
    if (!values || values.length === 0) {
        return <span className="text-xs text-black/40">-</span>;
    }

    return (
        <div className="flex max-w-[260px] flex-wrap gap-1">
            {values.map((value) => (
                <span key={value} className="rounded bg-[#002447]/10 px-2 py-1 text-xs font-medium text-[#002447]">
                    {value}
                </span>
            ))}
        </div>
    );
}

function AdminTextArea({
                           label,
                           value,
                           onChange,
                           placeholder,
                       }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/45">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-20 w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#006c67]"
                placeholder={placeholder}
            />
        </label>
    );
}

function splitList(value: string) {
    return value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function getRoleCount(values: Record<string, number>, role: string) {
    const normalizedRole = role.toUpperCase().replace(/^ROLE_/, "");
    const match = Object.entries(values).find(([key]) => (
        key.toUpperCase().replace(/^ROLE_/, "") === normalizedRole
    ));

    return match?.[1];
}

function getListingActions(
    listing: AdminModerationListing,
    summary: AdminActivitySummary | null
): AdminModerationAction[] {
    const values = summary?.moderationActions?.filter((item): item is AdminModerationAction => (
        item === "APPROVE" || item === "DELETE"
    ));
    const actions = (values && values.length > 0
        ? values
        : ["APPROVE", "DELETE"]) as AdminModerationAction[];

    return actions.filter((item) => item === "DELETE" || listing.status === "DRAFT");
}

function getDisputeActions(summary: AdminActivitySummary | null) {
    const values = summary?.disputeResolutionActions?.filter(Boolean);
    return values && values.length > 0 ? values : ["REFUND_BUYER", "RELEASE_TO_SELLER"];
}

function formatDate(value?: string | null) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatRupiah(value?: number | null) {
    if (value == null) return "-";

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}
