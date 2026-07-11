"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/OrgContext";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RoleBadge } from "@/components/RoleBadge";
import { apiFetch } from "@/lib/api";

type Role = "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
const ROLES: Role[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];

interface Member {
  userId: string;
  role: Role;
  user: { id: string; name: string; email: string };
}

interface Invitation {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export default function MembersPage() {
  const { currentOrg } = useOrg();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersCursor, setMembersCursor] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = currentOrg?.role === "ADMIN";

  async function loadMembers(orgId: string) {
    const res: PaginatedResponse<Member> = await apiFetch(
      `/api/organizations/${orgId}/members`,
    );
    setMembers(res.data);
    setMembersCursor(res.nextCursor);
  }

  async function loadInvitations(orgId: string) {
    const res: PaginatedResponse<Invitation> = await apiFetch(
      `/api/organizations/${orgId}/invitations`,
    );
    setInvitations(res.data);
  }

  useEffect(() => {
    if (!currentOrg) return;

    void (async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadMembers(currentOrg.id),
          // Only admins can list pending invitations — skip the call
          // otherwise so a non-admin doesn't see a console 403.
          currentOrg.role === "ADMIN"
            ? loadInvitations(currentOrg.id)
            : Promise.resolve(),
        ]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id, currentOrg?.role]);

  async function loadMoreMembers() {
    if (!currentOrg || !membersCursor) return;
    const res: PaginatedResponse<Member> = await apiFetch(
      `/api/organizations/${currentOrg.id}/members?cursor=${encodeURIComponent(membersCursor)}`,
    );
    setMembers((prev) => [...prev, ...res.data]);
    setMembersCursor(res.nextCursor);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setError("");
    try {
      const invitation = await apiFetch(
        `/api/organizations/${currentOrg.id}/invitations`,
        {
          method: "POST",
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        },
      );
      setInvitations((prev) => [invitation, ...prev]);
      setInviteEmail("");
      setInviteRole("MEMBER");
    } catch {
      setError(
        "Could not send invite — check the email isn't already a member or pending",
      );
    }
  }

  async function handleRoleChange(userId: string, role: Role) {
    if (!currentOrg) return;
    setError("");
    try {
      const updated = await apiFetch(
        `/api/organizations/${currentOrg.id}/members/${userId}`,
        { method: "PATCH", body: JSON.stringify({ role }) },
      );
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, role: updated.role } : m,
        ),
      );
    } catch {
      setError(
        "Could not change role — the organization must keep at least one admin",
      );
    }
  }

  async function handleRemove(userId: string) {
    if (!currentOrg) return;
    if (!confirm("Remove this member from the organization?")) return;
    setError("");
    try {
      await apiFetch(`/api/organizations/${currentOrg.id}/members/${userId}`, {
        method: "DELETE",
      });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch {
      setError(
        "Could not remove member — the organization must keep at least one admin",
      );
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50">
        <DashboardHeader />

        <main className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-1">
            Members
          </h1>
          <p className="text-sm text-zinc-500 mb-6">{currentOrg?.name}</p>

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {isAdmin && (
            <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-medium text-zinc-900 mb-3">
                Invite a member
              </h2>
              <form onSubmit={handleInvite} className="flex flex-wrap gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="flex-1 min-w-[200px] border border-zinc-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="border border-zinc-200 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Send invite
                </button>
              </form>

              {invitations.length > 0 && (
                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                    Pending invitations
                  </p>
                  <ul className="space-y-1.5">
                    {invitations.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-mono text-zinc-600">
                          {inv.email}
                        </span>
                        <div className="flex items-center gap-2">
                          <RoleBadge role={inv.role} />
                          <span className="text-xs text-zinc-400">
                            expires{" "}
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-zinc-400">Loading members…</p>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <ul className="divide-y divide-zinc-100">
                {members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {m.user.name}
                      </p>
                      <p className="text-xs text-zinc-400 font-mono">
                        {m.user.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.userId, e.target.value as Role)
                          }
                          className="text-xs border border-zinc-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleRemove(m.userId)}
                          className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {membersCursor && (
                <div className="text-center py-3 border-t border-zinc-100">
                  <button
                    onClick={loadMoreMembers}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
