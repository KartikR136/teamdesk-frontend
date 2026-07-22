"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  getMockDashboardData,
  type PullRequest,
  type PRReviewUrgency,
} from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";

// Same accent-bar idea already used for Sidebar's active state and
// DecisionCard's status spine — urgency communicated by a colored edge,
// not by burying it in a third badge.
const URGENCY_SPINE: Record<PRReviewUrgency, string> = {
  low: "before:bg-border",
  medium: "before:bg-warning",
  high: "before:bg-danger",
};

const MERGE_STATUS_CONFIG: Record<
  PullRequest["mergeStatus"],
  { icon: React.ReactNode; label: string; color: string }
> = {
  clean: {
    icon: <CheckCircle2 size={13} />,
    label: "Ready to merge",
    color: "text-success",
  },
  conflicts: {
    icon: <AlertTriangle size={13} />,
    label: "Has conflicts",
    color: "text-warning",
  },
  checks_failing: {
    icon: <XCircle size={13} />,
    label: "Checks failing",
    color: "text-danger",
  },
};

function hoursAgo(dateStr: string): string {
  const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PRRow({ pr, index }: { pr: PullRequest; index: number }) {
  const merge = MERGE_STATUS_CONFIG[pr.mergeStatus];
  return (
    <motion.a
      href={pr.url}
      // TODO: real GitHub PR URLs once the PR integration lands — mock
      // urls are "#" placeholders, deliberately not opening a new tab
      // to nowhere.
      onClick={(e) => pr.url === "#" && e.preventDefault()}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      className={cn(
        "relative block rounded-lg border border-border pl-4 pr-3 py-3 overflow-hidden",
        "hover:border-border-hover hover:shadow-sm hover:-translate-y-0.5 transition-all duration-normal",
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]",
        URGENCY_SPINE[pr.urgency],
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-text leading-snug">{pr.title}</p>
        <ExternalLink size={13} className="text-text-subtle shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-text-subtle mb-2 font-mono truncate">
        {pr.repo} · {pr.branch}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          {pr.author} · {hoursAgo(pr.openedAt)} · {pr.filesChanged} files
        </span>
        <span
          className={cn("flex items-center gap-1 font-medium", merge.color)}
        >
          {merge.icon}
          {merge.label}
        </span>
      </div>
    </motion.a>
  );
}

export function PullRequestsCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [prs, setPrs] = useState<PullRequest[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` and read `.pullRequests` — likely backed by a GitHub App
        // integration server-side, not this frontend directly.
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted) return;
        const data = getMockDashboardData().pullRequests;
        setPrs(data);
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
      title="Pull Requests Awaiting Review"
      icon={<GitPullRequest size={15} />}
      status={status}
      onRetry={() => setStatus("loading")}
      skeleton={
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      }
      emptyState={
        <EmptyState
          icon={<GitPullRequest size={26} />}
          title="No PRs waiting on you"
          description="Once GitHub is connected, review requests will land here."
          compact
        />
      }
      contentClassName="space-y-3"
    >
      {prs.map((pr, i) => (
        <PRRow key={pr.id} pr={pr} index={i} />
      ))}
    </WidgetCard>
  );
}
