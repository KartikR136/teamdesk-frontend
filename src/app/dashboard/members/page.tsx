"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { InviteCard } from "@/components/members/InviteCard";
import { MemberCard } from "@/components/members/MemberCard";
import { canManageMembers } from "@/lib/permissions";
import { apiFetch } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import type { Invitation, Member, PaginatedResponse, Role } from "@/types";

export default function MembersPage() {
  const { currentOrg } = useOrg();
  const notify = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersCursor, setMembersCursor] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allMembersLoaded, setAllMembersLoaded] = useState(false);

  const canManage = canManageMembers(currentOrg?.role);

  useEffect(() => {
    if (!currentOrg) return;
    setLoading(true);
    const membersReq = apiFetch<PaginatedResponse<Member>>(
      `/api/organizations/${currentOrg.id}/members`,
    ).then((res) => {
      setMembers(res.data);
      setMembersCursor(res.nextCursor);
      setAllMembersLoaded(!res.hasNextPage);
    });

    const invitationsReq = currentOrg.role === "ADMIN"
      ? apiFetch<PaginatedResponse<Invitation>>(
          `/api/organizations/${currentOrg.id}/invitations`,
        ).then((res) => setInvitations(res.data))
      : Promise.resolve();

    Promise.all([membersReq, invitationsReq]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id, currentOrg?.role]);

  async function loadMoreMembers() {
    if (!currentOrg || !membersCursor) return;
    setLoadingMore(true);
    apiFetch<PaginatedResponse<Member>>(
      `/api/organizations/${currentOrg.id}/members?cursor=${encodeURIComponent(membersCursor)}`,
    )
      .then((res) => {
        setMembers((prev) => [...prev, ...res.data]);
        setMembersCursor(res.nextCursor);
        setAllMembersLoaded(!res.hasNextPage);
      })
      .finally(() => setLoadingMore(false));
  }

  async function handleInvite(email: string, role: Role): Promise<boolean> {
    if (!currentOrg) return false;
    try {
      const invitation = await apiFetch<Invitation>(
        `/api/organizations/${currentOrg.id}/invitations`,
        { method: "POST", body: JSON.stringify({ email, role }) },
      );
      setInvitations((prev) => [invitation, ...prev]);
      notify.success("Invitation sent", `${email} will see it when they sign in.`);
      return true;
    } catch {
      notify.error("Could not send invite", "That email may already be a member or have a pending invite.");
      return false;
    }
  }

  async function handleRoleChange(userId: string, role: Role) {
    if (!currentOrg) return;
    try {
      const updated = await apiFetch<Member>(
        `/api/organizations/${currentOrg.id}/members/${userId}`,
        { method: "PATCH", body: JSON.stringify({ role }) },
      );
      setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role: updated.role } : m));
      notify.success("Role updated");
    } catch {
      notify.error("Could not change role", "The organization must keep at least one admin.");
    }
  }

  async function handleRemove(userId: string): Promise<boolean> {
    if (!currentOrg) return false;
    try {
      await apiFetch(`/api/organizations/${currentOrg.id}/members/${userId}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      notify.success("Member removed");
      return true;
    } catch {
      notify.error("Could not remove member", "The organization must keep at least one admin.");
      return false;
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-text">Members</h1>
            <p className="text-sm text-text-muted mt-0.5">{currentOrg?.name}</p>
          </div>

          {/* Invite panel (admin only) */}
          {canManage && (
            <div className="mb-7">
              <InviteCard invitations={invitations} onInvite={handleInvite} />
            </div>
          )}

          {/* Member list */}
          {loading ? (
            <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-9 w-9 rounded-full" round />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1.5" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-pill" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <EmptyStateCard>
              <EmptyState icon={<Users size={30} />} title="No members yet" description="Invite your teammates to get started." />
            </EmptyStateCard>
          ) : (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-background-subtle">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                  <span>Member</span>
                  <span>Role</span>
                  {canManage && <span />}
                </div>
              </div>
              <ul className="divide-y divide-border">
                {members.map((m, i) => (
                  <motion.li
                    key={m.userId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <MemberCard
                      member={m}
                      members={members}
                      allMembersLoaded={allMembersLoaded}
                      canManage={canManage}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemove}
                      index={i}
                    />
                  </motion.li>
                ))}
              </ul>
              {membersCursor && (
                <div className="text-center py-3 border-t border-border">
                  <Button variant="link" onClick={loadMoreMembers} disabled={loadingMore}>
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
