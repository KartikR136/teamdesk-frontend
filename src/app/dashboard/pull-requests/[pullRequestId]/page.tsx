"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  GitBranch,
  Check,
  AlertTriangle,
  MessageSquare,
  GitMerge,
  XCircle,
  Link2,
} from "lucide-react";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/providers/AuthProvider";
import { isAbortError } from "@/lib/api";
import {
  getPullRequest,
  submitReview,
  mergePullRequest,
  closePullRequest,
  reopenPullRequest,
  listPullRequestComments,
  createPullRequestComment,
} from "@/lib/pullRequests";
import { useNotify } from "@/lib/notifications";
import type { PullRequest, PullRequestComment, PRReviewStatus } from "@/types";

const REVIEW_BADGE: Record<PRReviewStatus, { label: string; variant: "neutral" | "success" | "danger" | "info" }> = {
  PENDING: { label: "Awaiting review", variant: "neutral" },
  APPROVED: { label: "Approved", variant: "success" },
  CHANGES_REQUESTED: { label: "Changes requested", variant: "danger" },
  COMMENTED: { label: "Commented", variant: "info" },
};

export default function PullRequestDetailPage() {
  const params = useParams<{ pullRequestId: string }>();
  const { user } = useAuth();
  const notify = useNotify();

  const [pr, setPr] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<PullRequestComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const data = await getPullRequest(params.pullRequestId, controller.signal);
        setPr(data);
        const c = await listPullRequestComments(params.pullRequestId);
        setComments(c.data);
      } catch (err) {
        if (isAbortError(err)) return;
        setPr(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [params.pullRequestId]);

  const isAuthor = pr?.authorId === user?.id;
  const myReview = pr?.reviewers.find((r) => r.user.id === user?.id);
  const isManagerPlus = false; // UX-only best guess; backend re-checks author/MANAGER+ on every write
  const canManage = isAuthor || isManagerPlus;

  async function handleReview(status: Exclude<PRReviewStatus, "PENDING">) {
    if (!pr || !user) return;
    const previous = pr;
    setPr({
      ...pr,
      reviewers: pr.reviewers.some((r) => r.user.id === user.id)
        ? pr.reviewers.map((r) =>
            r.user.id === user.id
              ? { ...r, status, respondedAt: new Date().toISOString() }
              : r,
          )
        : [
            ...pr.reviewers,
            {
              id: `temp-${user.id}`,
              status,
              requestedAt: new Date().toISOString(),
              respondedAt: new Date().toISOString(),
              user: { id: user.id, name: user.name, email: user.email },
            },
          ],
    });
    try {
      await submitReview(pr.id, status);
      notify.success(
        status === "APPROVED"
          ? "Approved"
          : status === "CHANGES_REQUESTED"
            ? "Changes requested"
            : "Comment recorded",
      );
    } catch {
      setPr(previous);
      notify.error("Could not submit review", "Please try again.");
    }
  }

  async function handleMerge() {
    if (!pr) return;
    setMerging(true);
    try {
      const updated = await mergePullRequest(pr.id);
      setPr(updated);
      notify.success(
        pr.linkedIssues.length > 0
          ? `Merged — ${pr.linkedIssues.length} linked issue${pr.linkedIssues.length === 1 ? "" : "s"} marked done`
          : "Merged",
      );
    } catch {
      notify.error(
        "Could not merge",
        "A reviewer may have requested changes, or the PR isn't open.",
      );
    } finally {
      setMerging(false);
    }
  }

  async function handleClose() {
    if (!pr) return;
    try {
      const updated = await closePullRequest(pr.id);
      setPr(updated);
      notify.success("Pull request closed");
    } catch {
      notify.error("Could not close", "Please try again.");
    }
  }

  async function handleReopen() {
    if (!pr) return;
    try {
      const updated = await reopenPullRequest(pr.id);
      setPr(updated);
      notify.success("Pull request reopened");
    } catch {
      notify.error("Could not reopen", "Please try again.");
    }
  }

  async function handlePostComment() {
    if (!pr || !commentBody.trim()) return;
    setPosting(true);
    try {
      await createPullRequestComment(pr.id, commentBody.trim());
      const c = await listPullRequestComments(pr.id);
      setComments(c.data);
      setCommentBody("");
    } catch {
      notify.error("Could not post comment", "Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link
            href="/dashboard/pull-requests"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Pull Requests
          </Link>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-32 w-full mt-6" />
            </div>
          ) : !pr ? (
            <Card className="border-dashed px-8 py-14 text-center">
              <p className="text-text-muted">
                This pull request doesn&apos;t exist, or you don&apos;t have access to it.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-xl font-semibold text-text tracking-tight">
                  {pr.title}
                </h1>
                {pr.status === "MERGED" && (
                  <Badge variant="subtle">
                    <GitMerge size={10} /> Merged
                  </Badge>
                )}
                {pr.status === "CLOSED" && <Badge variant="neutral">Closed</Badge>}
                {pr.status === "OPEN" && (
                  <Badge
                    variant={
                      pr.mergeStatus === "CLEAN"
                        ? "success"
                        : pr.mergeStatus === "CONFLICTS"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {pr.mergeStatus === "CLEAN" ? (
                      <Check size={10} />
                    ) : (
                      <XCircle size={10} />
                    )}
                    {pr.mergeStatus.replace("_", " ").toLowerCase()}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-text-subtle mb-6">
                <span className="inline-flex items-center gap-1 font-mono">
                  <GitBranch size={12} />
                  {pr.repoName} · {pr.sourceBranch} → {pr.targetBranch}
                </span>
                {pr.project && (
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban size={12} />
                    {pr.project.name}
                  </span>
                )}
                <span>
                  {pr.filesChanged} files · +{pr.linesAdded}/-{pr.linesRemoved}
                </span>
                <span>Opened by {pr.author.name}</span>
              </div>

              {pr.description && (
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap mb-6">
                  {pr.description}
                </p>
              )}

              {!isAuthor && pr.status === "OPEN" && (
                <Card className="p-4 mb-6">
                  <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-3">
                    Your review
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={myReview?.status === "APPROVED" ? "primary" : "secondary"}
                      onClick={() => void handleReview("APPROVED")}
                    >
                      <Check size={14} />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        myReview?.status === "CHANGES_REQUESTED" ? "danger" : "secondary"
                      }
                      onClick={() => void handleReview("CHANGES_REQUESTED")}
                    >
                      <AlertTriangle size={14} />
                      Request changes
                    </Button>
                  </div>
                </Card>
              )}

              <div className="space-y-6">
                <div>
                  <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-2">
                    Reviewers ({pr.reviewers.length})
                  </h2>
                  {pr.reviewers.length === 0 ? (
                    <p className="text-sm text-text-subtle">No reviewers requested yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {pr.reviewers.map((r) => {
                        const badge = REVIEW_BADGE[r.status];
                        return (
                          <div
                            key={r.id}
                            className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                          >
                            <span className="text-sm text-text">{r.user.name}</span>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {pr.linkedIssues.length > 0 && (
                  <div>
                    <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Link2 size={12} />
                      Linked Issues ({pr.linkedIssues.length})
                    </h2>
                    <div className="space-y-2">
                      {pr.linkedIssues.map((li) => (
                        <div
                          key={li.id}
                          className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                        >
                          <span className="text-sm text-text">{li.issue.title}</span>
                          <Badge variant="neutral">{li.issue.status}</Badge>
                        </div>
                      ))}
                    </div>
                    {pr.status === "MERGED" && (
                      <p className="text-xs text-text-subtle mt-2">
                        Merging this PR marked every linked issue as done.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-2 flex items-center gap-1">
                    <MessageSquare size={12} />
                    Discussion ({comments.length})
                  </h2>
                  <div className="space-y-3 mb-3">
                    {comments.map((c) => (
                      <div key={c.id} className="rounded-md border border-border px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-text">
                            {c.author.name}
                          </span>
                          <span className="text-[11px] text-text-subtle">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-text whitespace-pre-wrap">{c.body}</p>
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Leave a review comment…"
                    rows={3}
                    maxLength={20000}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors duration-normal ease-standard focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover resize-y"
                  />
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={posting || !commentBody.trim()}
                      onClick={() => void handlePostComment()}
                    >
                      {posting ? "Posting…" : "Comment"}
                    </Button>
                  </div>
                </div>
              </div>

              {canManage && pr.status === "OPEN" && (
                <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border">
                  <Button size="sm" disabled={merging} onClick={() => void handleMerge()}>
                    <GitMerge size={14} />
                    {merging ? "Merging…" : "Merge"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void handleClose()}>
                    Close
                  </Button>
                </div>
              )}
              {canManage && pr.status === "CLOSED" && (
                <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border">
                  <Button size="sm" variant="secondary" onClick={() => void handleReopen()}>
                    Reopen
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
