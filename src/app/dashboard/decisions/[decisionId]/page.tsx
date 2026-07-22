"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Calendar, FolderKanban, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import type { DecisionFormValues } from "@/components/decisions/DecisionForm";
import { DecisionStatusControl } from "@/components/decisions/DecisionStatusControl";
import { useAuth } from "@/providers/AuthProvider";
import { useOrg } from "@/providers/OrgProvider";
import { apiFetch, isAbortError } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import type { Decision, DecisionStatus } from "@/types";

// Loaded on demand — most visits to this page only ever hit the
// read-only view below (fieldSections etc.), and never open the edit
// form. Splitting it out of this route's main chunk means the far more
// common case (viewing a decision) doesn't pay to load the form's code
// (296 lines: field validation, related-issue picker, project select).
const DecisionForm = dynamic(
  () =>
    import("@/components/decisions/DecisionForm").then((m) => m.DecisionForm),
  {
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    ),
  },
);

// Field/label pairs for the read-only view — kept as data so the render
// below is a simple map, not five nearly-identical JSX blocks.
function fieldSections(decision: Decision) {
  return [
    { label: "Problem statement", value: decision.problemStatement },
    { label: "Context", value: decision.context },
    { label: "Alternatives considered", value: decision.alternatives },
    { label: "Chosen solution", value: decision.chosenSolution },
    { label: "Trade-offs", value: decision.tradeoffs },
    ...(decision.consequences
      ? [{ label: "Consequences", value: decision.consequences }]
      : []),
  ];
}

export default function DecisionDetailPage() {
  const params = useParams<{ decisionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const notify = useNotify();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const data = await apiFetch<Decision>(
          `/api/decisions/${params.decisionId}`,
          { signal: controller.signal },
        );
        setDecision(data);
      } catch (err) {
        // A superseded request (rapid navigation between decisions, or
        // unmount) isn't a real failure — this decisionId is no longer
        // the one on screen, so don't touch state at all.
        if (isAbortError(err)) return;
        setDecision(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [params.decisionId]);

  // UX-only — the backend's author-or-admin check on PATCH/status/DELETE
  // is the real enforcement (see decisions.ts). This only decides whether
  // to show the controls at all, matching lib/permissions.ts's stated
  // philosophy elsewhere in this codebase.
  const canManage =
    !!decision &&
    !!user &&
    (decision.authorId === user.id || currentOrg?.role === "ADMIN");

  async function handleStatusChange(status: DecisionStatus) {
    if (!decision) return;
    const previous = decision.status;
    setDecision({ ...decision, status }); // optimistic
    try {
      const updated = await apiFetch<Decision>(
        `/api/decisions/${decision.id}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setDecision(updated);
      notify.success("Status updated");
    } catch {
      setDecision({ ...decision, status: previous }); // revert
      notify.error("Could not update status", "Please try again.");
    }
  }

  async function handleEditSubmit(values: DecisionFormValues) {
    if (!decision) return;
    const updated = await apiFetch<Decision>(`/api/decisions/${decision.id}`, {
      method: "PATCH",
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
    });
    setDecision(updated);
    setEditing(false);
    notify.success("Decision updated");
  }

  async function handleDelete() {
    if (!decision) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/decisions/${decision.id}`, { method: "DELETE" });
      notify.success("Decision deleted");
      router.push("/dashboard/decisions");
    } catch {
      notify.error("Could not delete this decision", "Please try again.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link
            href="/dashboard/decisions"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Decision Log
          </Link>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-32 w-full mt-6" />
            </div>
          ) : !decision ? (
            <Card className="border-dashed px-8 py-14 text-center">
              <p className="text-text-muted">
                This decision doesn&apos;t exist, or you don&apos;t have access
                to it.
              </p>
            </Card>
          ) : editing ? (
            <>
              <h1 className="text-xl font-semibold text-text tracking-tight mb-6">
                Edit decision
              </h1>
              <DecisionForm
                organizationId={decision.organizationId}
                initial={decision}
                submitLabel="Save changes"
                onSubmit={handleEditSubmit}
                onCancel={() => setEditing(false)}
              />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-xl font-semibold text-text tracking-tight">
                  {decision.title}
                </h1>
                {canManage ? (
                  <DecisionStatusControl
                    status={decision.status}
                    onChange={(s) => void handleStatusChange(s)}
                  />
                ) : (
                  <Badge variant="neutral">{decision.status}</Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-text-subtle mb-6">
                <span>By {decision.author.name}</span>
                {decision.project && (
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban size={12} />
                    {decision.project.name}
                  </span>
                )}
                {decision.reviewDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} />
                    Review by{" "}
                    {new Date(decision.reviewDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {fieldSections(decision).map((section) => (
                  <div key={section.label}>
                    <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1.5">
                      {section.label}
                    </h2>
                    <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                      {section.value}
                    </p>
                  </div>
                ))}

                {decision.relatedIssues.length > 0 && (
                  <div>
                    <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1.5">
                      Related issues
                    </h2>
                    <ul className="space-y-1">
                      {decision.relatedIssues.map(({ issue }) => (
                        <li key={issue.id}>
                          <Link
                            href={`/dashboard/projects/${decision.projectId ?? ""}/issues/${issue.id}`}
                            className="text-sm text-primary hover:text-primary-hover transition-colors"
                          >
                            {issue.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {canManage && (
                <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>

                  {/* Irreversible action — always requires explicit
                      confirmation, per PRD 3's destructive-action rule.
                      Controlled Dialog, matching MemberCard.tsx's exact
                      established pattern in this codebase rather than
                      introducing a DialogTrigger/asChild variant. */}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>

                  <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent>
                      <DialogTitle>Delete this decision?</DialogTitle>
                      <DialogDescription>
                        This permanently removes &ldquo;{decision.title}
                        &rdquo; and its record of why this choice was made. This
                        can&apos;t be undone.
                      </DialogDescription>
                      <DialogFooter>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={deleting}
                          onClick={() => void handleDelete()}
                        >
                          {deleting ? "Deleting…" : "Delete permanently"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
