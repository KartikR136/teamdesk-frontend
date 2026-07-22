"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, ChevronRight } from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  getMockDashboardData,
  type RecentlyViewedIssue,
} from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";
import type { IssuePriority, IssueStatus } from "@/types";

const PRIORITY_VARIANT: Record<
  IssuePriority,
  "neutral" | "warning" | "danger"
> = {
  LOW: "neutral",
  MEDIUM: "neutral",
  HIGH: "warning",
  URGENT: "danger",
};

const STATUS_LABEL: Record<IssueStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function IssueRow({
  issue,
  index,
}: {
  issue: RecentlyViewedIssue;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.03, duration: 0.25 }}
      // TODO: wrap in <Link href={`/dashboard/projects/:projectId/issues/${issue.id}`}>
      // once recently-viewed items carry a real projectId from the backend.
      className={cn(
        "group flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md",
        "hover:bg-surface-hover transition-colors duration-fast cursor-pointer",
      )}
    >
      <Badge variant={PRIORITY_VARIANT[issue.priority]} className="shrink-0">
        {issue.priority}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text truncate group-hover:text-primary transition-colors">
          {issue.title}
        </p>
        <p className="text-xs text-text-subtle">
          {issue.projectName} · {STATUS_LABEL[issue.status]} · viewed{" "}
          {timeAgo(issue.lastViewedAt)}
        </p>
      </div>
      <ChevronRight
        size={15}
        className="text-text-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
      />
    </motion.div>
  );
}

export function RecentIssuesCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [issues, setIssues] = useState<RecentlyViewedIssue[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` and read `.recentIssues`.
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted) return;
        const data = getMockDashboardData().recentIssues;
        setIssues(data);
        setStatus(data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <WidgetCard
      title="Recently Viewed Issues"
      icon={<History size={15} />}
      status={status}
      onRetry={() => setStatus("loading")}
      skeleton={
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-4/5 mb-1.5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      }
      emptyState={
        <EmptyState
          icon={<History size={26} />}
          title="No recently viewed issues"
          description="Issues you open will show up here for quick access."
          compact
        />
      }
      contentClassName="-my-1"
    >
      {issues.map((issue, i) => (
        <IssueRow key={issue.id} issue={issue} index={i} />
      ))}
    </WidgetCard>
  );
}
