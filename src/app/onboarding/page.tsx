"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { InvitedStep } from "@/components/onboarding/InvitedStep";
import { CreateWorkspaceStep } from "@/components/onboarding/CreateWorkspaceStep";
import { InviteTeamStep } from "@/components/onboarding/InviteTeamStep";
import { CreateProjectStep } from "@/components/onboarding/CreateProjectStep";
import { apiFetch } from "@/lib/api";
import { useOrg } from "@/providers/OrgProvider";
import type { MyInvitation, Organization } from "@/types";

type Phase =
  | "checking"
  | "invited"
  | "create-workspace"
  | "invite-team"
  | "create-project";

/**
 * Onboarding flow, reached only right after signup (see signup/page.tsx).
 *
 * Sequence:
 * 1. "checking" — silently check GET /api/invitations/me. If the user was
 *    invited before signing up, skip straight to "invited" rather than
 *    forcing them to create a redundant workspace of their own.
 * 2. "create-workspace" — the one non-skippable step. A brand-new user
 *    genuinely has nothing to see without this.
 * 3. "invite-team" and "create-project" — both skippable, in that order,
 *    matching PRD 2's core loop (create org -> invite -> create project).
 *
 * Per PRD 1's "never show an empty dashboard" and PRD 2's first-time-
 * experience requirements, this flow exists specifically so a new user's
 * first /dashboard visit already has at least a real organization behind
 * it, not a bare "you don't belong to any organization yet" state.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { setCurrentOrgId, refetchOrgs } = useOrg();

  const [phase, setPhase] = useState<Phase>("checking");
  const [invitations, setInvitations] = useState<MyInvitation[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const invites = await apiFetch<MyInvitation[]>("/api/invitations/me");
        if (invites.length > 0) {
          setInvitations(invites);
          setPhase("invited");
        } else {
          setPhase("create-workspace");
        }
      } catch {
        // If the invitation check itself fails, don't block onboarding on
        // it — fall through to workspace creation, the one path that
        // doesn't depend on this endpoint succeeding.
        setPhase("create-workspace");
      }
    })();
  }, []);

  async function finishToDashboard() {
    await refetchOrgs();
    router.push("/dashboard");
  }

  return (
    <ProtectedRoute>
      <OnboardingShell
        activeStep={
          phase === "invite-team" ? 1 : phase === "create-project" ? 2 : 0
        }
      >
        {phase === "checking" && (
          <p className="text-sm text-text-subtle">Checking your invitations…</p>
        )}

        {phase === "invited" && (
          <InvitedStep
            invitations={invitations}
            onResolved={() => void finishToDashboard()}
            onSkip={() => setPhase("create-workspace")}
          />
        )}

        {phase === "create-workspace" && (
          <CreateWorkspaceStep
            onCreated={(createdOrg) => {
              setOrg(createdOrg);
              setCurrentOrgId(createdOrg.id);
              setPhase("invite-team");
            }}
          />
        )}

        {phase === "invite-team" && org && (
          <InviteTeamStep
            organizationId={org.id}
            onContinue={() => setPhase("create-project")}
          />
        )}

        {phase === "create-project" && org && (
          <CreateProjectStep
            organizationId={org.id}
            onDone={() => void finishToDashboard()}
          />
        )}
      </OnboardingShell>
    </ProtectedRoute>
  );
}
