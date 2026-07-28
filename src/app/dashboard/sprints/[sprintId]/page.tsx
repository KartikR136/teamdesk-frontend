"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Rows3,
  Circle,
  Zap,
  GitBranch,
  CheckCircle2,
  Target,
} from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Issue, SprintDetail, SprintStatus } from "@/types";

const STATUS_CONFIG: Record<
  Issue["status"],
  { icon: React.ReactNode; label: string; badge: "neutral" | "subtle" | "warning" | "success" }
> = {
  TODO: { icon: <Circle size={13} />, label: "To Do", badge: "neutral" },
  IN_PROGRESS: { icon: <Zap size={13} />, label: "In Progress", badge: "subtle" },
  IN_REVIEW: { icon: <GitBranch size={13} />, label: "In Review", badge: "warning" },
  DONE: { icon: <CheckCircle2 size={13} />, label: "Done", badge: "success" },
};

const SPRINT_STATUS_FLOW: Record<SprintStatus, SprintStatus | null> = {
  PLANNED: "ACTIVE",
  ACTIVE: "COMPLETED",
  COMPLETED: null,
};

const SPRINT_STATUS_LABEL: Record<SprintStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

const SPRINT_STATUS_BADGE: Record<SprintStatus, "neutral" | "success" | "subtle"> = {
  PLANNED: "neutral",
  ACTIVE: "subtle",
  COMPLETED: "success",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SprintDetailPage() {
  const { sprintId } = useParams<{ sprintId: string }>();
  const router = useRouter();
  const { currentOrg } = useOrg();
  const notify = useNotify();

  const [sprint, setSprint] = useState<SprintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<SprintDetail>(`/api/sprints/${sprintId}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setSprint(res);
      } catch {
        if (controller.signal.aborted) return;
        setSprint(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [sprintId]);

  async function advanceStatus() {
    if (!sprint) return;
    const next = SPRINT_STATUS_FLOW[sprint.status];
    if (!next) return;
    setAdvancing(true);
    try {
      const updated = await apiFetch<SprintDetail>(`/api/sprints/${sprint.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setSprint((prev) => (prev ? { ...prev, status: updated.status } : prev));
      notify.success(`Sprint ${next === "ACTIVE" ? "started" : "completed"}`);
    } catch {
      notify.error("Could not update sprint status");
    } finally {
      setAdvancing(false);
    }
  }

  const canManage =
    currentOrg && ["ADMIN", "MANAGER", "MEMBER"].includes(currentOrg.role);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardShell>
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  if (!sprint) {
    return (
      <ProtectedRoute>
        <DashboardShell>
          <div className="max-w-3xl mx-auto px-6 py-8">
            <EmptyStateCard>
              <EmptyState
                icon={<Rows3 size={30} />}
                title="Sprint not found"
                description="It may have been removed, or you may not have access to it."
              />
            </EmptyStateCard>
          </div>
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  const nextStatus = SPRINT_STATUS_FLOW[sprint.status];

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link
            href="/dashboard/sprints"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-5"
          >
            <ChevronLeft size={14} />
            Back to sprints
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text">
                {sprint.name}
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                <Link
                  href={`/dashboard/projects/${sprint.projectId}`}
                  className="hover:text-text transition-colors"
                >
                  {sprint.project.name}
                </Link>
                {" · "}
                {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
              </p>
            </div>
            <Badge variant={SPRINT_STATUS_BADGE[sprint.status]}>
              {SPRINT_STATUS_LABEL[sprint.status]}
            </Badge>
          </div>

          {sprint.goal && (
            <p className="flex items-start gap-1.5 text-sm text-text-muted mt-3">
              <Target size={14} className="mt-0.5 shrink-0 text-text-subtle" />
              {sprint.goal}
            </p>
          )}

          {/* Progress card */}
          <div className="mt-5 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text">
                {sprint.progress.doneIssues} of {sprint.progress.totalIssues} issues done
              </span>
              <span className="text-sm text-text-muted">
                {sprint.progress.percentComplete}%
              </span>
            </div>
            <div className="h-2 w-full rounded-pill bg-surface-hover overflow-hidden">
              <motion.div
                className="h-full rounded-pill bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${sprint.progress.percentComplete}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            {sprint.progress.totalPoints > 0 && (
              <p className="text-xs text-text-subtle mt-2">
                {sprint.progress.donePoints} / {sprint.progress.totalPoints} story points
              </p>
            )}

            {canManage && nextStatus && (
              <button
                onClick={advanceStatus}
                disabled={advancing}
                className={cn(
                  "mt-3 text-xs font-medium text-primary hover:text-primary-hover transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {advancing
                  ? "Updating…"
                  : nextStatus === "ACTIVE"
                    ? "Start sprint →"
                    : "Mark sprint complete →"}
              </button>
            )}
          </div>

          {/* Issues */}
          <h2 className="text-sm font-semibold text-text mt-7 mb-3">
            Issues ({sprint.issues.length})
          </h2>
          {sprint.issues.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<Rows3 size={30} />}
                title="No issues in this sprint yet"
                description="Add issues to this sprint from Quick Actions' Create Issue dialog, or from the project's issue list."
              />
            </EmptyStateCard>
          ) : (
            <ul className="space-y-1.5">
              {sprint.issues.map((issue, i) => {
                const sc = STATUS_CONFIG[issue.status];
                return (
                  <motion.li
                    key={issue.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <div
                      role="link"
                      tabIndex={0}
                      onClick={() =>
                        router.push(
                          `/dashboard/projects/${issue.projectId}/issues/${issue.id}`,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          router.push(
                            `/dashboard/projects/${issue.projectId}/issues/${issue.id}`,
                          );
                      }}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 cursor-pointer",
                        "hover:border-border-hover hover:shadow-sm hover:-translate-y-px",
                        "transition-all duration-normal",
                      )}
                    >
                      <span
                        className={cn(
                          "shrink-0",
                          issue.status === "DONE"
                            ? "text-success"
                            : issue.status === "IN_REVIEW"
                              ? "text-warning"
                              : issue.status === "IN_PROGRESS"
                                ? "text-primary"
                                : "text-text-subtle",
                        )}
                      >
                        {sc.icon}
                      </span>
                      <span className="flex-1 text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
                        {issue.title}
                      </span>
                      {issue.assignee && (
                        <span className="text-xs text-text-subtle shrink-0">
                          {issue.assignee.name}
                        </span>
                      )}
                      <Badge variant={sc.badge} className="text-[11px] shrink-0">
                        {sc.label}
                      </Badge>
                      <ChevronRight
                        size={14}
                        className="text-text-subtle group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0"
                      />
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
