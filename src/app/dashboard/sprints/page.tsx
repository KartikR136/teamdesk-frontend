"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Rows3, Plus, ChevronRight } from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useQuickActions } from "@/components/quickActions/QuickActionsProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { PaginatedResponse, Sprint, SprintStatus } from "@/types";

const STATUS_BADGE: Record<SprintStatus, { label: string; variant: "neutral" | "success" | "subtle" }> = {
  PLANNED: { label: "Planned", variant: "neutral" },
  ACTIVE: { label: "Active", variant: "subtle" },
  COMPLETED: { label: "Completed", variant: "success" },
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function SprintsPage() {
  const { currentOrg } = useOrg();
  const { openCreateSprint } = useQuickActions();

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<Sprint>>(
          `/api/organizations/${currentOrg.id}/sprints?limit=50`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setSprints(res.data);
      } catch {
        if (controller.signal.aborted) return;
        setSprints([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [currentOrg]);

  const canCreate =
    currentOrg && ["ADMIN", "MANAGER", "MEMBER"].includes(currentOrg.role);

  // Active sprints first, then planned, then completed — the ones
  // someone is most likely to click on right now float to the top,
  // rather than a flat createdAt-desc list mixing all three together.
  const order: SprintStatus[] = ["ACTIVE", "PLANNED", "COMPLETED"];
  const sorted = [...sprints].sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status),
  );

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text">
                Sprints
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {sprints.length} {sprints.length === 1 ? "sprint" : "sprints"} in{" "}
                {currentOrg?.name ?? "this organization"}
              </p>
            </div>
            {canCreate && (
              <Button
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => openCreateSprint()}
              >
                New sprint
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-pill" />
                </div>
              ))}
            </div>
          ) : sprints.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<Rows3 size={30} />}
                title="No sprints yet"
                description="Create a sprint to start planning iterations for a project."
                action={
                  canCreate ? (
                    <Button
                      size="sm"
                      leftIcon={<Plus size={14} />}
                      onClick={() => openCreateSprint()}
                    >
                      New sprint
                    </Button>
                  ) : undefined
                }
              />
            </EmptyStateCard>
          ) : (
            <ul className="space-y-1.5">
              {sorted.map((sprint, i) => {
                const total = sprint._count.issues;
                const badge = STATUS_BADGE[sprint.status];
                return (
                  <motion.li
                    key={sprint.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <Link href={`/dashboard/sprints/${sprint.id}`}>
                      <div
                        className={cn(
                          "group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5",
                          "hover:border-border-hover hover:shadow-sm hover:-translate-y-px",
                          "transition-all duration-normal",
                        )}
                      >
                        <Rows3 size={17} className="text-text-subtle shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
                            {sprint.name}
                          </p>
                          <p className="text-xs text-text-subtle truncate">
                            {sprint.project.name} · {formatDateRange(sprint.startDate, sprint.endDate)}
                          </p>
                        </div>
                        <span className="text-xs text-text-subtle shrink-0">
                          {total} {total === 1 ? "issue" : "issues"}
                        </span>
                        <Badge variant={badge.variant} className="text-[11px] shrink-0">
                          {badge.label}
                        </Badge>
                        <ChevronRight
                          size={14}
                          className="text-text-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>
                    </Link>
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
