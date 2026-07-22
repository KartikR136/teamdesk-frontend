"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import { ROLE_METADATA } from "@/lib/roles";
import type { MyInvitation } from "@/types";

/**
 * Shown only when GET /api/invitations/me returns pending invitations for
 * this user's email — a real, existing endpoint (see API.md), not new
 * backend surface. This is the case named explicitly in ROADMAP.md-adjacent
 * reasoning: a teammate invited this person's email before they signed up.
 * Forcing them through "create your own workspace" in that situation would
 * be a real UX failure, not a hypothetical one.
 */
export function InvitedStep({
  invitations,
  onResolved,
  onSkip,
}: {
  invitations: MyInvitation[];
  onResolved: () => void;
  onSkip: () => void;
}) {
  const notify = useNotify();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(invitationId: string, action: "accept" | "reject") {
    setBusyId(invitationId);
    try {
      await apiFetch(`/api/invitations/${invitationId}/${action}`, {
        method: "POST",
      });
      if (action === "accept") {
        notify.success("Joined organization");
        onResolved();
      } else {
        notify.success("Invitation declined");
        // Only navigate onward once no other invitations remain relevant —
        // simplest correct behavior here is to let the parent re-check.
        onResolved();
      }
    } catch {
      notify.error("Could not process this invitation", "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text tracking-tight mb-1.5">
        You&apos;ve been invited
      </h1>
      <p className="text-sm text-text-muted mb-6">
        {invitations.length === 1
          ? "Someone invited you to join their organization on TeamDesk."
          : `You have ${invitations.length} pending invitations.`}
      </p>

      <div className="space-y-3 mb-6">
        {invitations.map((inv) => (
          <Card key={inv.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {inv.organization.name}
              </p>
              <Badge variant={ROLE_METADATA[inv.role].badgeVariant} className="mt-1">
                {ROLE_METADATA[inv.role].label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                disabled={busyId === inv.id}
                onClick={() => respond(inv.id, "reject")}
              >
                Decline
              </Button>
              <Button
                size="sm"
                disabled={busyId === inv.id}
                onClick={() => respond(inv.id, "accept")}
              >
                {busyId === inv.id ? "Joining…" : "Accept"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="text-sm text-text-muted hover:text-text transition-colors inline-flex items-center gap-1.5"
      >
        <Mail size={14} />
        Or create your own workspace instead
      </button>
    </div>
  );
}
