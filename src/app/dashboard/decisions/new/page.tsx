"use client";

import { useRouter } from "next/navigation";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DecisionForm, type DecisionFormValues } from "@/components/decisions/DecisionForm";
import { apiFetch } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import type { Decision } from "@/types";

export default function NewDecisionPage() {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const notify = useNotify();

  async function handleSubmit(values: DecisionFormValues) {
    if (!currentOrg) return;

    const decision = await apiFetch<Decision>(
      `/api/organizations/${currentOrg.id}/decisions`,
      {
        method: "POST",
        body: JSON.stringify({
          title: values.title,
          problemStatement: values.problemStatement,
          context: values.context,
          alternatives: values.alternatives,
          chosenSolution: values.chosenSolution,
          tradeoffs: values.tradeoffs,
          consequences: values.consequences || undefined,
          projectId: values.projectId || null,
          reviewDate: values.reviewDate
            ? new Date(values.reviewDate).toISOString()
            : null,
          relatedIssueIds: values.relatedIssueIds,
        }),
      },
    );

    notify.success("Decision recorded", decision.title);
    router.push(`/dashboard/decisions/${decision.id}`);
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-xl font-semibold text-text tracking-tight mb-1">
            Record a decision
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Capture the context now, while it&apos;s still fresh — future
            readers won&apos;t have the conversation you&apos;re having today.
          </p>

          {currentOrg && (
            <DecisionForm
              organizationId={currentOrg.id}
              submitLabel="Save decision"
              onSubmit={handleSubmit}
              onCancel={() => router.push("/dashboard/decisions")}
            />
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
