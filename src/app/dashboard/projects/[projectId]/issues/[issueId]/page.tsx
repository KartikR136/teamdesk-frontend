"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/providers/AuthProvider";
import { useOrg } from "@/providers/OrgProvider";
import { apiFetch, ApiError, isAbortError } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { IssueHeader } from "@/components/issue/IssueHeader";
import { IssueMetadata } from "@/components/issue/IssueMetadata";
import { IssueDescription } from "@/components/issue/IssueDescription";
import { IssueComments } from "@/components/issue/IssueComments";
import type { Comment, IssueDetail, IssueStatus } from "@/types";

export default function IssueDetailPage() {
  const { projectId, issueId } = useParams<{
    projectId: string;
    issueId: string;
  }>();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const notify = useNotify();

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  // Distinguish "genuinely doesn't exist / no access" (404/403) from any
  // other failure (network blip, 500) — these deserve different messages
  // and a generic failure should offer retry, not imply the issue is gone.
  const [loadError, setLoadError] = useState<"not_found" | "other" | null>(
    null,
  );
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void loadIssue(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

  async function loadIssue(signal?: AbortSignal) {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch<IssueDetail>(`/api/issues/${issueId}`, {
        signal,
      });
      setIssue(data);
    } catch (err) {
      // A superseded request (component unmounted, or issueId changed
      // again before this one resolved) isn't a real failure — just
      // stop quietly. Setting loading/error state here would be wrong
      // anyway: this request's issueId is no longer the one on screen.
      if (isAbortError(err)) return;

      // Never swallow silently — this is exactly the kind of failure
      // (e.g. a backend route that wasn't deployed) that's invisible
      // without a console trace.
      console.error("Failed to load issue", issueId, err);
      if (err instanceof ApiError && err.status === 404) {
        setLoadError("not_found");
      } else {
        setLoadError("other");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  async function handleStatusChange(status: IssueStatus) {
    if (!issue) return;
    setStatusUpdating(true);
    const previous = issue.status;
    setIssue({ ...issue, status }); // optimistic
    try {
      await apiFetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("Failed to update issue status", issueId, err);
      setIssue((prev) => (prev ? { ...prev, status: previous } : prev));
      // This was the actual reported bug: every other mutation handler in
      // this file already calls notify.error() on failure, but this one
      // only logged to console and reverted silently — so a failed status
      // change looked exactly like nothing happened at all.
      const message =
        err instanceof ApiError && err.status === 403
          ? "You don't have permission to change this issue's status."
          : "Please try again.";
      notify.error("Could not update status", message);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleAddComment(body: string): Promise<boolean> {
    try {
      const comment = await apiFetch<Comment>(
        `/api/issues/${issueId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ body }),
        },
      );
      setIssue((prev) =>
        prev ? { ...prev, comments: [comment, ...prev.comments] } : prev,
      );
      notify.success("Comment posted");
      return true;
    } catch (err) {
      console.error("Failed to add comment", issueId, err);
      notify.error("Could not post comment", "Please try again.");
      return false;
    }
  }

  async function handleEditComment(
    commentId: string,
    body: string,
  ): Promise<boolean> {
    try {
      const updated = await apiFetch<Comment>(`/api/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
      setIssue((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) =>
                c.id === commentId ? updated : c,
              ),
            }
          : prev,
      );
      notify.success("Comment updated");
      return true;
    } catch (err) {
      console.error("Failed to edit comment", commentId, err);
      notify.error("Could not save edit", "Please try again.");
      return false;
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await apiFetch(`/api/comments/${commentId}`, { method: "DELETE" });
      setIssue((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== commentId),
            }
          : prev,
      );
      notify.success("Comment deleted");
    } catch (err) {
      console.error("Failed to delete comment", commentId, err);
      notify.error("Could not delete comment", "Please try again.");
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-10">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!loading && loadError === "not_found" && (
            <Card className="border-dashed px-8 py-16 text-center">
              <p className="text-text-muted">Issue not found.</p>
              <p className="text-sm text-text-subtle mt-1">
                It may have been deleted, or you may not have access to it.
              </p>
              <Link
                href={`/dashboard/projects/${projectId}`}
                className="inline-block mt-4 text-sm text-primary hover:text-primary-hover transition-colors"
              >
                Return to project
              </Link>
            </Card>
          )}

          {!loading && loadError === "other" && (
            <Card className="border-dashed px-8 py-16 text-center">
              <p className="text-text-muted">
                Something went wrong loading this issue.
              </p>
              <p className="text-sm text-text-subtle mt-1">
                This is usually temporary — check your connection and try again.
              </p>
              <button
                onClick={() => void loadIssue()}
                className="inline-block mt-4 text-sm text-primary hover:text-primary-hover transition-colors"
              >
                Try again
              </button>
            </Card>
          )}

          {!loading && !loadError && issue && (
            <>
              <IssueHeader title={issue.title} projectId={projectId} />

              <Card className="p-5 mb-6">
                <IssueMetadata
                  status={issue.status}
                  onStatusChange={handleStatusChange}
                  statusDisabled={statusUpdating}
                  priority={issue.priority}
                  creator={issue.creator}
                  assignee={issue.assignee}
                  createdAt={issue.createdAt}
                  updatedAt={issue.updatedAt}
                />
              </Card>

              <div className="mb-8">
                <h2 className="text-sm font-semibold text-text mb-2">
                  Description
                </h2>
                <IssueDescription description={issue.description} />
              </div>

              <IssueComments
                comments={issue.comments}
                currentUserId={user?.id}
                currentUserRole={currentOrg?.role}
                onAdd={handleAddComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            </>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
