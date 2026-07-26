"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { createDeployment } from "@/lib/deployments";
import { useNotify } from "@/lib/notifications";
import type { DeployEnvironment, PaginatedResponse, PullRequest } from "@/types";

const ENVIRONMENTS: { value: DeployEnvironment; label: string }[] = [
  { value: "PRODUCTION", label: "Production" },
  { value: "STAGING", label: "Staging" },
  { value: "PREVIEW", label: "Preview" },
  { value: "DEVELOPMENT", label: "Development" },
];

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

export default function NewDeploymentPage() {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const notify = useNotify();

  const [environment, setEnvironment] = useState<DeployEnvironment>("PRODUCTION");
  const [commitHash, setCommitHash] = useState(randomHex(7));
  const [commitMessage, setCommitMessage] = useState("");
  const [branch, setBranch] = useState("main");
  const [pullRequestId, setPullRequestId] = useState("");
  const [mergedPRs, setMergedPRs] = useState<PullRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    // Merged PRs are the natural "what's this deploy shipping" picker —
    // linking one is what powers the DORA lead-time-for-changes metric.
    apiFetch<PaginatedResponse<PullRequest>>(
      `/api/organizations/${currentOrg.id}/pull-requests?status=MERGED&limit=25`,
    )
      .then((res) => setMergedPRs(res.data))
      .catch(() => setMergedPRs([]));
  }, [currentOrg]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg || !commitMessage.trim() || !commitHash.trim()) return;
    setSubmitting(true);
    try {
      const deployment = await createDeployment(currentOrg.id, {
        environment,
        commitHash: commitHash.trim(),
        commitMessage: commitMessage.trim(),
        branch: branch.trim() || "main",
        pullRequestId: pullRequestId || undefined,
      });
      if (deployment.status === "SUCCESS") {
        notify.success(
          "Deployment succeeded",
          `${commitHash.slice(0, 7)} is live on ${environment.toLowerCase()}`,
        );
      } else {
        notify.error(
          "Deployment failed",
          "Check the deployment detail page for next steps.",
        );
      }
      router.push(`/dashboard/deployments/${deployment.id}`);
    } catch {
      notify.error("Could not trigger deployment", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="text-xl font-semibold text-text tracking-tight mb-1">
            Trigger a deployment
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Simulates a CI/CD pipeline run — the outcome is derived
            deterministically from the commit hash so the same hash always
            resolves the same way. Wire up a real webhook later without
            touching this form.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                Environment
              </label>
              <div className="flex flex-wrap gap-2">
                {ENVIRONMENTS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setEnvironment(opt.value)}
                    className={
                      environment === opt.value
                        ? "px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-white"
                        : "px-3 py-1.5 rounded-full text-xs font-medium bg-surface-hover text-text-muted border border-border hover:border-border-hover"
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                  Commit hash
                </label>
                <div className="flex gap-2">
                  <input
                    value={commitHash}
                    onChange={(e) => setCommitHash(e.target.value)}
                    required
                    maxLength={40}
                    placeholder="a1b2c3d"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setCommitHash(randomHex(7))}
                    className="shrink-0 px-2.5 rounded-md border border-border text-xs text-text-muted hover:border-border-hover"
                  >
                    Random
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                  Branch
                </label>
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  maxLength={200}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                Commit message
              </label>
              <input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                required
                maxLength={500}
                placeholder="Fix race condition in meeting RSVP upsert"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
                Linked pull request (optional)
              </label>
              <select
                value={pullRequestId}
                onChange={(e) => setPullRequestId(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary"
              >
                <option value="">None</option>
                {mergedPRs.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-subtle mt-1">
                Linking a merged PR powers the "lead time for changes" DORA
                metric on the deployments overview.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !commitMessage.trim() || !commitHash.trim()}
              >
                {submitting ? "Deploying…" : "Deploy now"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => router.push("/dashboard/deployments")}
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
