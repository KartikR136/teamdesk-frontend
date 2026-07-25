"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Check,
  MessageSquare,
  Link2,
} from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { apiFetch, isAbortError } from "@/lib/api";
import { submitReview } from "@/lib/pullRequests";
import { useNotify } from "@/lib/notifications";
import type { PullRequestSummary, PRReviewUrgency } from "@/types";

// Same accent-bar idea already used for Sidebar's active state and
// DecisionCard's status spine — urgency communicated by a colored edge,
// not by burying it in a third badge.
const URGENCY_SPINE: Record<PRReviewUrgency, string> = {
  low: "before:bg-border",
  medium: "before:bg-warning",
  high: "before:bg-danger",
};

const MERGE_STATUS_CONFIG: Record<
  PullRequestSummary["mergeStatus"],
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

// Shape returned by GET /api/dashboard/home — only the one field this
// widget actually reads, matching MeetingsCard.tsx's convention.
interface DashboardHomePRResponse {
  pullRequests: PullRequestSummary[];
}

function hoursAgo(dateStr: string): string {
  const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PRRow({
  pr,
  index,
  onApprove,
  onRequestChanges,
}: {
  pr: PullRequestSummary;
  index: number;
  onApprove: (id: string) => void;
  onRequestChanges: (id: string) => void;
}) {
  const merge = MERGE_STATUS_CONFIG[pr.mergeStatus];
  // Native PRs link to their own detail page; an externalUrl-backed PR
  // (from a real git host) still opens in a new tab like the old mock did.
  const isExternal = pr.url.startsWith("http");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      className={cn(
        "relative rounded-lg border border-border pl-4 pr-3 py-3 overflow-hidden",
        "hover:border-border-hover hover:shadow-sm transition-all duration-normal",
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]",
        URGENCY_SPINE[pr.urgency],
      )}
    >
      <Link href={pr.url} {...(isExternal ? { target: "_blank" } : {})}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-text leading-snug hover:text-primary transition-colors">
            {pr.title}
          </p>
          <ExternalLink size={13} className="text-text-subtle shrink-0 mt-0.5" />
        </div>
        <p className="text-xs text-text-subtle mb-2 font-mono truncate">
          {pr.repo} · {pr.branch}
          {pr.projectName ? ` · ${pr.projectName}` : ""}
        </p>
      </Link>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-text-muted flex items-center gap-1.5 flex-wrap">
          {pr.author} · {hoursAgo(pr.openedAt)} · {pr.filesChanged} files
          {!!pr.linkedIssueCount && (
            <span className="inline-flex items-center gap-0.5 text-primary">
              <Link2 size={10} />
              {pr.linkedIssueCount}
            </span>
          )}
          {!!pr.commentCount && (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare size={10} />
              {pr.commentCount}
            </span>
          )}
        </span>
        <span
          className={cn("flex items-center gap-1 font-medium shrink-0", merge.color)}
        >
          {merge.icon}
          {merge.label}
        </span>
      </div>

      {!pr.isAuthor && pr.myReviewStatus !== "APPROVED" && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-border">
          <Tooltip content="Approve">
            <button
              onClick={() => onApprove(pr.id)}
              className="h-6 px-2 rounded-md flex items-center gap-1 text-xs font-medium text-success hover:bg-success-subtle transition-colors"
            >
              <Check size={12} />
              Approve
            </button>
          </Tooltip>
          <Tooltip content="Request changes">
            <button
              onClick={() => onRequestChanges(pr.id)}
              className="h-6 px-2 rounded-md flex items-center gap-1 text-xs font-medium text-danger hover:bg-danger-subtle transition-colors"
            >
              <AlertTriangle size={12} />
              Request changes
            </button>
          </Tooltip>
        </div>
      )}
    </motion.div>
  );
}

export function PullRequestsCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [prs, setPrs] = useState<PullRequestSummary[]>([]);
  const notify = useNotify();

  const load = useCallback((signal?: AbortSignal) => {
    setStatus("loading");
    return apiFetch<DashboardHomePRResponse>("/api/dashboard/home", { signal })
      .then((data) => {
        setPrs(data.pullRequests);
        setStatus(data.pullRequests.length === 0 ? "empty" : "ready");
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function handleReview(
    pullRequestId: string,
    reviewStatus: "APPROVED" | "CHANGES_REQUESTED",
  ) {
    const previous = prs;
    if (reviewStatus === "APPROVED") {
      // Optimistically drop it off the "awaiting review" list — approving
      // is what clears a PR from here (see NativePullRequestProvider).
      setPrs((prev) => prev.filter((pr) => pr.id !== pullRequestId));
    } else {
      setPrs((prev) =>
        prev.map((pr) =>
          pr.id === pullRequestId
            ? { ...pr, myReviewStatus: "CHANGES_REQUESTED" }
            : pr,
        ),
      );
    }
    try {
      await submitReview(pullRequestId, reviewStatus);
      notify.success(
        reviewStatus === "APPROVED" ? "Approved" : "Changes requested",
      );
    } catch {
      setPrs(previous);
      notify.error("Could not submit review", "Please try again.");
    }
  }

  return (
    <WidgetCard
      title="Pull Requests Awaiting Review"
      icon={<GitPullRequest size={15} />}
      status={status}
      headerAction={
        <Link
          href="/dashboard/pull-requests"
          className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
        >
          View all
        </Link>
      }
      onRetry={() => void load()}
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
          description="Every open pull request you're a reviewer on lives here. Open one from a project to get started."
          compact
          action={
            <Link
              href="/dashboard/pull-requests/new"
              className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Open a pull request
            </Link>
          }
        />
      }
      contentClassName="space-y-3"
    >
      {prs.map((pr, i) => (
        <PRRow
          key={pr.id}
          pr={pr}
          index={i}
          onApprove={(id) => handleReview(id, "APPROVED")}
          onRequestChanges={(id) => handleReview(id, "CHANGES_REQUESTED")}
        />
      ))}
    </WidgetCard>
  );
}
