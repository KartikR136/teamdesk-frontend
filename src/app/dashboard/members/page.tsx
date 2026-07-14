"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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

  const canManage = canManageMembers(currentOrg?.role);
  // Only true once a fetch has come back with hasNextPage === false — i.e.
  // we've actually seen every member, not just assumed the first page was
  // everything. isLastRemainingAdmin() in lib/permissions.ts refuses to
  // answer definitively until this is true, by design.
  const [allMembersLoaded, setAllMembersLoaded] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;

    void (async () => {
      setLoading(true);
      try {
        const membersReq = apiFetch<PaginatedResponse<Member>>(
          `/api/organizations/${currentOrg.id}/members`,
        ).then((res) => {
          setMembers(res.data);
          setMembersCursor(res.nextCursor);
          setAllMembersLoaded(!res.hasNextPage);
        });

        const invitationsReq =
          currentOrg.role === "ADMIN"
            ? apiFetch<PaginatedResponse<Invitation>>(
                `/api/organizations/${currentOrg.id}/invitations`,
              ).then((res) => setInvitations(res.data))
            : Promise.resolve();

        await Promise.all([membersReq, invitationsReq]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id, currentOrg?.role]);

  async function loadMoreMembers() {
    if (!currentOrg || !membersCursor) return;
    setLoadingMore(true);
    try {
      const res = await apiFetch<PaginatedResponse<Member>>(
        `/api/organizations/${currentOrg.id}/members?cursor=${encodeURIComponent(membersCursor)}`,
      );
      setMembers((prev) => [...prev, ...res.data]);
      setMembersCursor(res.nextCursor);
      setAllMembersLoaded(!res.hasNextPage);
    } finally {
      setLoadingMore(false);
    }
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
      notify.error(
        "Could not send invite",
        "That email may already be a member or have a pending invite.",
      );
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
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: updated.role } : m)),
      );
      notify.success("Role updated");
    } catch {
      // Backend's own last-admin check — the safety net for the race
      // condition the frontend can't rule out on a partially loaded list.
      notify.error(
        "Could not change role",
        "The organization must keep at least one admin.",
      );
    }
  }

  async function handleRemove(userId: string): Promise<boolean> {
    if (!currentOrg) return false;
    try {
      await apiFetch(`/api/organizations/${currentOrg.id}/members/${userId}`, {
        method: "DELETE",
      });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      notify.success("Member removed");
      return true;
    } catch {
      notify.error(
        "Could not remove member",
        "The organization must keep at least one admin.",
      );
      return false;
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-text mb-1">Members</h1>
          <p className="text-sm text-text-muted mb-6">{currentOrg?.name}</p>

          {canManage && (
            <div className="mb-8">
              <InviteCard invitations={invitations} onInvite={handleInvite} />
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-border">
                {members.map((m) => (
                  <li key={m.userId}>
                    <MemberCard
                      member={m}
                      members={members}
                      allMembersLoaded={allMembersLoaded}
                      canManage={canManage}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemove}
                    />
                  </li>
                ))}
              </ul>

              {membersCursor && (
                <div className="text-center py-3 border-t border-border">
                  <Button variant="link" onClick={loadMoreMembers} disabled={loadingMore}>
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
