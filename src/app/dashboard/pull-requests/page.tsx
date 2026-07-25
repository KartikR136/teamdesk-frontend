"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GitMerge,
  Link2,
  MessageSquare,
} from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { listPullRequests } from "@/lib/pullRequests";
import type { PullRequest, PRStatus } from "@/types";

const MERGE_STATUS_ICON: Record<
  PullRequest["mergeStatus"],
  { icon: React.ReactNode; color: string; label: string }
> = {
  CLEAN: { icon: <CheckCircle2 size={13} />, color: "text-success", label: "Clean" },
  CONFLICTS: {
    icon: <AlertTriangle size={13} />,
    color: "text-warning",
    label: "Conflicts",
  },
  CHECKS_FAILING: {
    icon: <XCircle size={13} />,
    color: "text-danger",
    label: "Checks failing",
  },
};

const TABS: { value: PRStatus | "ALL"; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "MERGED", label: "Merged" },
  { value: "CLOSED", label: "Closed" },
  { value: "ALL", label: "All" },
];

function PRListRow({ pr }: { pr: PullRequest }) {
  const merge = MERGE_STATUS_ICON[pr.mergeStatus];
  const approvals = pr.reviewers.filter((r) => r.status === "APPROVED").length;

  return (
    <Link
      href={`/dashboard/pull-requests/${pr.id}`}
      className="block rounded-lg border border-border px-4 py-3 hover:border-border-hover hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-sm font-medium text-text leading-snug">{pr.title}</p>
        {pr.status === "MERGED" && (
          <Badge variant="subtle" className="shrink-0">
            <GitMerge size={10} /> Merged
          </Badge>
        )}
        {pr.status === "CLOSED" && (
          <Badge variant="neutral" className="shrink-0">
            Closed
          </Badge>
        )}
      </div>
      <p className="text-xs text-text-subtle font-mono truncate mb-2">
        {pr.repoName} · {pr.sourceBranch} → {pr.targetBranch}
        {pr.project ? ` · ${pr.project.name}` : ""}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted flex items-center gap-1.5 flex-wrap">
          {pr.author.name} · {pr.filesChanged} files (+{pr.linesAdded}/-
          {pr.linesRemoved})
          {pr.reviewers.length > 0 && (
            <span>
              · {approvals}/{pr.reviewers.length} approved
            </span>
          )}
          {pr.linkedIssues.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-primary">
              <Link2 size={10} />
              {pr.linkedIssues.length}
            </span>
          )}
          {pr._count.comments > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare size={10} />
              {pr._count.comments}
            </span>
          )}
        </span>
        {pr.status === "OPEN" && (
          <span className={cn("flex items-center gap-1 font-medium", merge.color)}>
            {merge.icon}
            {merge.label}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function PullRequestsPage() {
  const { currentOrg } = useOrg();
  const [tab, setTab] = useState<PRStatus | "ALL">("OPEN");
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    setLoading(true);
    listPullRequests(currentOrg.id, {
      status: tab === "ALL" ? undefined : tab,
      limit: 50,
    })
      .then((res) => setPrs(res.data))
      .catch(() => setPrs([]))
      .finally(() => setLoading(false));
  }, [currentOrg, tab]);

  const counts = useMemo(() => {
    const open = prs.filter((p) => p.status === "OPEN").length;
    return { open };
  }, [prs]);

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text tracking-tight">
                Pull Requests
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                Code review tracking across every project in this org.
              </p>
            </div>
            <Link href="/dashboard/pull-requests/new">
              <Button size="sm" leftIcon={<Plus size={14} />}>
                Open pull request
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-1 mb-5 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === t.value
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text",
                )}
              >
                {t.label}
                {t.value === "OPEN" && counts.open > 0 && ` (${counts.open})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : prs.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<GitPullRequest size={30} />}
                title="No pull requests here"
                description="Nothing in this view yet. Open one to start tracking a review."
                action={
                  <Link href="/dashboard/pull-requests/new">
                    <Button size="sm">Open your first pull request</Button>
                  </Link>
                }
              />
            </EmptyStateCard>
          ) : (
            <div className="space-y-2">
              {prs.map((pr) => (
                <PRListRow key={pr.id} pr={pr} />
              ))}
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
