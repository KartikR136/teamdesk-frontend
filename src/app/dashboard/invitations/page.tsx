"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RoleBadge } from "@/components/RoleBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useOrg } from "@/providers/OrgProvider";
import { apiFetch } from "@/lib/api";
import type { MyInvitation } from "@/types";

export default function InvitationsPage() {
  const { refetchOrgs, setCurrentOrgId } = useOrg();
  const [invitations, setInvitations] = useState<MyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await apiFetch<MyInvitation[]>("/api/invitations/me");
        setInvitations(data);
      } catch {
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAccept(invitation: MyInvitation) {
    setError("");
    setActioningId(invitation.id);
    try {
      await apiFetch(`/api/invitations/${invitation.id}/accept`, {
        method: "POST",
      });
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      // Refresh the org list so the newly-joined org shows up in the
      // switcher immediately, and jump straight to it.
      await refetchOrgs();
      setCurrentOrgId(invitation.organization.id);
    } catch {
      setError("Could not accept this invitation — it may have expired.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(invitation: MyInvitation) {
    setError("");
    setActioningId(invitation.id);
    try {
      await apiFetch(`/api/invitations/${invitation.id}/reject`, {
        method: "POST",
      });
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    } catch {
      setError("Could not decline this invitation.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-text mb-1">
            My invitations
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Organizations that have invited you to join.
          </p>

          {error && (
            <p className="mb-4 text-sm text-danger bg-danger-subtle border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {loading && (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </Card>
              ))}
            </div>
          )}

          {!loading && invitations.length === 0 && (
            <Card className="border-dashed px-8 py-16 text-center">
              <p className="text-text-muted">No pending invitations.</p>
              <p className="text-sm text-text-subtle mt-1">
                When someone invites you to their organization, it&apos;ll
                show up here.
              </p>
            </Card>
          )}

          {!loading && invitations.length > 0 && (
            <ul className="space-y-2">
              {invitations.map((inv) => (
                <li key={inv.id}>
                  <Card className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={inv.organization.name} size="lg" />
                      <div>
                        <p className="text-sm font-medium text-text">
                          {inv.organization.name}
                        </p>
                        <RoleBadge role={inv.role} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(inv)}
                        disabled={actioningId === inv.id}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(inv)}
                        disabled={actioningId === inv.id}
                      >
                        Decline
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
