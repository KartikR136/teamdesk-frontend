"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollText, Plus, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { DecisionCard } from "@/components/decisions/DecisionCard";
import {
  DECISION_STATUS_METADATA,
  DECISION_STATUS_ORDER,
} from "@/lib/decisions";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DecisionListItem, DecisionStatus, PaginatedResponse } from "@/types";

type StatusFilter = DecisionStatus | "ALL";

const STATUS_BADGE_MAP: Record<DecisionStatus, "neutral" | "success" | "warning" | "subtle"> = {
  DRAFT:       "neutral",
  ACCEPTED:    "success",
  SUPERSEDED:  "warning",
  ARCHIVED:    "subtle",
};

export default function DecisionsPage() {
  const { currentOrg } = useOrg();
  const [decisions, setDecisions] = useState<DecisionListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  useEffect(() => {
    if (!currentOrg) return;
    setLoading(true);
    const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
    apiFetch<PaginatedResponse<DecisionListItem>>(
      `/api/organizations/${currentOrg.id}/decisions${query}`,
    )
      .then((res) => { setDecisions(res.data); setNextCursor(res.nextCursor); })
      .catch(() => { setDecisions([]); setNextCursor(null); })
      .finally(() => setLoading(false));
  }, [currentOrg, statusFilter]);

  async function loadMore() {
    if (!currentOrg || !nextCursor) return;
    setLoadingMore(true);
    const query =
      (statusFilter === "ALL" ? "?" : `?status=${statusFilter}&`) +
      `cursor=${encodeURIComponent(nextCursor)}`;
    apiFetch<PaginatedResponse<DecisionListItem>>(
      `/api/organizations/${currentOrg.id}/decisions${query}`,
    )
      .then((res) => { setDecisions((prev) => [...prev, ...res.data]); setNextCursor(res.nextCursor); })
      .finally(() => setLoadingMore(false));
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-xl font-semibold text-text tracking-tight">Decision Log</h1>
              <p className="text-sm text-text-muted mt-0.5">
                The why behind every significant engineering choice.
              </p>
            </div>
            <Link href="/dashboard/decisions/new">
              <Button size="sm" leftIcon={<Plus size={14} />}>New decision</Button>
            </Link>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-5 mb-6">
            <Filter size={13} className="text-text-subtle mr-1" />
            {(["ALL", ...DECISION_STATUS_ORDER] as StatusFilter[]).map((s) => {
              const isAll = s === "ALL";
              const meta = isAll ? null : DECISION_STATUS_METADATA[s as DecisionStatus];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium",
                    "transition-all duration-fast",
                    statusFilter === s
                      ? "bg-primary-subtle text-primary shadow-xs"
                      : "text-text-muted hover:bg-surface-hover",
                  )}
                >
                  {!isAll && (
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      s === "ACCEPTED" ? "bg-success" :
                      s === "DRAFT" ? "bg-text-subtle" :
                      s === "SUPERSEDED" ? "bg-warning" : "bg-border",
                    )} />
                  )}
                  {isAll ? "All" : meta!.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="h-5 w-16 rounded-pill" />
                    <Skeleton className="h-4 w-12 rounded-pill" />
                  </div>
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : decisions.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<ScrollText size={30} />}
                title={statusFilter === "ALL" ? "No decisions yet" : `No ${DECISION_STATUS_METADATA[statusFilter as DecisionStatus].label.toLowerCase()} decisions`}
                description="A decision records the context, alternatives, and trade-offs — so the reasoning isn't lost when the conversation ends."
                action={statusFilter === "ALL" ? (
                  <Link href="/dashboard/decisions/new">
                    <Button size="sm">Record your first decision</Button>
                  </Link>
                ) : undefined}
              />
            </EmptyStateCard>
          ) : (
            <>
              <div className="space-y-3">
                {decisions.map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
                  >
                    <DecisionCard decision={d} index={i} />
                  </motion.div>
                ))}
              </div>
              {nextCursor && (
                <div className="mt-5 text-center">
                  <Button variant="link" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
