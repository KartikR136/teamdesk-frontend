"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RoleBadge } from "@/components/RoleBadge";
import { useOrg } from "@/lib/OrgContext";
import { apiFetch } from "@/lib/api";

interface Invitation {
  id: string;
  role: "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
  organization: { id: string; name: string; slug: string };
}

export default function InvitationsPage() {
  const { refetchOrgs, setCurrentOrgId } = useOrg();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/invitations/me")
      .then(setInvitations)
      .catch(() => setInvitations([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleAccept(invitation: Invitation) {
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

  async function handleReject(invitation: Invitation) {
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
      <div className="min-h-screen bg-zinc-50">
        <DashboardHeader />

        <main className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-1">
            My invitations
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            Organizations that have invited you to join.
          </p>

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {loading && <p className="text-sm text-zinc-400">Loading…</p>}

          {!loading && invitations.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center">
              <p className="text-zinc-500">No pending invitations.</p>
              <p className="text-sm text-zinc-400 mt-1">
                When someone invites you to their organization, it&apos;ll show
                up here.
              </p>
            </div>
          )}

          {invitations.length > 0 && (
            <ul className="space-y-2">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white text-sm font-semibold">
                      {inv.organization.name[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {inv.organization.name}
                      </p>
                      <RoleBadge role={inv.role} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(inv)}
                      disabled={actioningId === inv.id}
                      className="text-sm font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(inv)}
                      disabled={actioningId === inv.id}
                      className="text-sm text-zinc-500 px-3 py-1.5 rounded-md hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
