"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {
    AdminRole,
    AdminUser,
    adminAssignPermission,
    adminAssignRole,
    adminCreateRole,
    adminListRoles,
    adminListUsers,
    adminRevokePermission,
    adminRevokeRole,
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
    const [roleName, setRoleName] = useState("");
    const [rolePermissions, setRolePermissions] = useState("");
    const [loading, setLoading] = useState(true);
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
        return {active, suspended, admins, total: users.length};
    }, [users]);

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
            setUsers(userData);
            setRoles(roleData);
            selectUser((selectedUserId && userData.find((user) => user.id === selectedUserId)) || userData[0] || null);
            selectRole((selectedRoleId && roleData.find((role) => role.id === selectedRoleId)) || null);
        } catch (err: unknown) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Gagal memuat data admin.",
            });
        } finally {
            setLoading(false);
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

    useEffect(() => {
        void Promise.resolve().then(loadData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    <Stat label="Admin" value={stats.admins}/>
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
