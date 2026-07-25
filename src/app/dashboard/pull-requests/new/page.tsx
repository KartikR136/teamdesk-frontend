"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrg } from "@/providers/OrgProvider";
import { useAuth } from "@/providers/AuthProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { createPullRequest } from "@/lib/pullRequests";
import { useNotify } from "@/lib/notifications";
import type { Member, PaginatedResponse } from "@/types";

export default function NewPullRequestPage() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const router = useRouter();
  const notify = useNotify();

  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoName, setRepoName] = useState("");
  const [sourceBranch, setSourceBranch] = useState("");
  const [targetBranch, setTargetBranch] = useState("main");
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    apiFetch<PaginatedResponse<Member>>(
      `/api/organizations/${currentOrg.id}/members?limit=100`,
    )
      .then((res) => setMembers(res.data.filter((m) => m.userId !== user?.id)))
      .catch(() => setMembers([]));
  }, [currentOrg, user]);

  function toggleReviewer(userId: string) {
    setReviewerIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg || !title.trim() || !repoName.trim() || !sourceBranch.trim()) return;
    setSubmitting(true);
    try {
      const pr = await createPullRequest(currentOrg.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        repoName: repoName.trim(),
        sourceBranch: sourceBranch.trim(),
        targetBranch: targetBranch.trim() || "main",
        reviewerUserIds: reviewerIds,
      });
      notify.success(
        "Pull request opened",
        reviewerIds.length > 0
          ? `${reviewerIds.length} reviewer${reviewerIds.length === 1 ? "" : "s"} notified`
          : undefined,
      );
      router.push(`/dashboard/pull-requests/${pr.id}`);
    } catch {
      notify.error("Could not open pull request", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="text-xl font-semibold text-text tracking-tight mb-1">
            Open a pull request
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Track a code review here — works alongside your real git host, or
            entirely on its own.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="Add pagination to the issues list"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                  Repository
                </label>
                <input
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  required
                  maxLength={200}
                  placeholder="teamdesk/web"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                  Target branch
                </label>
                <input
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  maxLength={200}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                Source branch
              </label>
              <input
                value={sourceBranch}
                onChange={(e) => setSourceBranch(e.target.value)}
                required
                maxLength={200}
                placeholder="feat/issue-pagination"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={20000}
                placeholder="What changed, and why?"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                Request reviewers
              </label>
              <div className="flex flex-wrap gap-2">
                {members.length === 0 ? (
                  <p className="text-sm text-text-subtle">No other members in this org yet.</p>
                ) : (
                  members.map((m) => {
                    const selected = reviewerIds.includes(m.userId);
                    return (
                      <button
                        type="button"
                        key={m.userId}
                        onClick={() => toggleReviewer(m.userId)}
                        className={
                          selected
                            ? "px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-white"
                            : "px-2.5 py-1 rounded-full text-xs font-medium bg-surface-hover text-text-muted border border-border hover:border-border-hover"
                        }
                      >
                        {m.user.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !title.trim() || !repoName.trim() || !sourceBranch.trim()}
              >
                {submitting ? "Opening…" : "Open pull request"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => router.push("/dashboard/pull-requests")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
