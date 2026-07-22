"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderPlus,
  FolderKanban,
  ListTodo,
  Users,
  MessageSquare,
  CheckCircle2,
  PenLine,
  Trash2,
  UserPlus,
  UserCog,
  UserMinus,
  Building2,
} from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { apiFetch, isAbortError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ActivityEntry, ActivityAction, PaginatedResponse } from "@/types";

const ACTION_CONFIG: Record<
  ActivityAction,
  {
    icon: React.ReactNode;
    color: string;
    label: (user: string) => string;
  }
> = {
  ORGANIZATION_CREATED: {
    icon: <Building2 size={14} />,
    color: "text-primary bg-primary-subtle",
    label: (u) => `${u} created this organization`,
  },
  PROJECT_CREATED: {
    icon: <FolderPlus size={14} />,
    color: "text-primary bg-primary-subtle",
    label: (u) => `${u} created a project`,
  },
  ISSUE_CREATED: {
    icon: <ListTodo size={14} />,
    color: "text-info bg-info-subtle",
    label: (u) => `${u} opened an issue`,
  },
  ISSUE_UPDATED: {
    icon: <PenLine size={14} />,
    color: "text-warning bg-warning-subtle",
    label: (u) => `${u} updated an issue`,
  },
  COMMENT_CREATED: {
    icon: <MessageSquare size={14} />,
    color: "text-text-muted bg-surface-hover",
    label: (u) => `${u} added a comment`,
  },
  COMMENT_EDITED: {
    icon: <PenLine size={14} />,
    color: "text-text-muted bg-surface-hover",
    label: (u) => `${u} edited a comment`,
  },
  COMMENT_DELETED: {
    icon: <Trash2 size={14} />,
    color: "text-danger bg-danger-subtle",
    label: (u) => `${u} deleted a comment`,
  },
  MEMBER_INVITED: {
    icon: <UserPlus size={14} />,
    color: "text-success bg-success-subtle",
    label: (u) => `${u} sent an invitation`,
  },
  MEMBER_JOINED: {
    icon: <CheckCircle2 size={14} />,
    color: "text-success bg-success-subtle",
    label: (u) => `${u} joined the workspace`,
  },
  MEMBER_ROLE_CHANGED: {
    icon: <UserCog size={14} />,
    color: "text-warning bg-warning-subtle",
    label: (u) => `${u} changed a member's role`,
  },
  MEMBER_REMOVED: {
    icon: <UserMinus size={14} />,
    color: "text-danger bg-danger-subtle",
    label: (u) => `${u} removed a member`,
  },
  DECISION_CREATED: {
    icon: <FolderKanban size={14} />,
    color: "text-primary bg-primary-subtle",
    label: (u) => `${u} recorded a decision`,
  },
  DECISION_UPDATED: {
    icon: <PenLine size={14} />,
    color: "text-warning bg-warning-subtle",
    label: (u) => `${u} updated a decision`,
  },
  DECISION_STATUS_CHANGED: {
    icon: <CheckCircle2 size={14} />,
    color: "text-success bg-success-subtle",
    label: (u) => `${u} changed a decision's status`,
  },
  DECISION_DELETED: {
    icon: <Trash2 size={14} />,
    color: "text-danger bg-danger-subtle",
    label: (u) => `${u} deleted a decision`,
  },
};

const DEFAULT_CONFIG = {
  icon: <Building2 size={14} />,
  color: "text-text-muted bg-surface-hover",
  label: (u: string) => `${u} performed an action`,
} as const;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(
  entries: ActivityEntry[],
): { date: string; items: ActivityEntry[] }[] {
  const groups: Record<string, ActivityEntry[]> = {};
  entries.forEach((e) => {
    const key = new Date(e.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

export default function ActivityPage() {
  const { currentOrg } = useOrg();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;

    const controller = new AbortController();

    // Effect body is a single async IIFE — setLoading/setEntries all run
    // inside it, not synchronously at the top of the effect, per this
    // project's documented convention (DEPLOYMENT.md) for avoiding the
    // "Calling setState synchronously within an effect" warning. The
    // AbortController is unrelated to that warning and still does its
    // own job: cancelling a stale request on org-switch or unmount so it
    // can't resolve after a newer one and overwrite state.
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<ActivityEntry>>(
          `/api/organizations/${currentOrg.id}/activity`,
          { signal: controller.signal },
        );
        setEntries(res.data);
        setNextCursor(res.nextCursor);
      } catch (err) {
        if (isAbortError(err)) return;
        setEntries([]);
        setNextCursor(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [currentOrg]);

  // loadMore is a click handler, not an effect, so it has no natural
  // cleanup point to abort against. A mounted ref guards the same
  // failure mode: if the user navigates away mid-request, we simply
  // skip the setState calls instead of trusting the request to resolve
  // before anything changes.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function loadMore() {
    if (!currentOrg || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await apiFetch<PaginatedResponse<ActivityEntry>>(
        `/api/organizations/${currentOrg.id}/activity?cursor=${encodeURIComponent(nextCursor)}`,
      );
      if (!isMountedRef.current) return;
      setEntries((prev) => [...prev, ...res.data]);
      setNextCursor(res.nextCursor);
    } finally {
      if (isMountedRef.current) setLoadingMore(false);
    }
  }

  const groups = groupByDate(entries);

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-text">
              Activity
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              {currentOrg?.name} · full audit trail
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" round />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-48 mb-1.5" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<ListTodo size={30} />}
                title="No activity yet"
                description="Every meaningful action your team takes will appear here."
              />
            </EmptyStateCard>
          ) : (
            <div className="space-y-8">
              {groups.map(({ date, items }, gi) => (
                <div key={date}>
                  {/* Date divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    {items.map((entry, i) => {
                      const cfg = ACTION_CONFIG[entry.action] ?? DEFAULT_CONFIG;
                      const name = entry.user.name;
                      const initials = name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      return (
                        <motion.div
                          key={entry.id}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-surface-hover transition-colors duration-fast"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: gi * 0.05 + i * 0.03,
                            duration: 0.3,
                          }}
                        >
                          {/* Actor avatar */}
                          <div className="h-7 w-7 rounded-full bg-primary-subtle flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {initials}
                          </div>
                          {/* Action icon */}
                          <div
                            className={cn(
                              "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
                              cfg.color,
                            )}
                          >
                            {cfg.icon}
                          </div>
                          {/* Label */}
                          <p className="flex-1 text-sm text-text">
                            {cfg.label(name)}
                          </p>
                          {/* Time */}
                          <span className="text-xs text-text-subtle shrink-0">
                            {formatDate(entry.createdAt)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {nextCursor && (
                <div className="text-center pt-2">
                  <Button
                    variant="link"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
