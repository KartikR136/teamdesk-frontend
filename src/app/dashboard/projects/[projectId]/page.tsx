"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ListTodo } from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { ISSUE_STATUSES, type Issue, type PaginatedResponse } from "@/types";

const STATUS_BADGE: Record<Issue["status"], "neutral" | "subtle" | "warning" | "success"> = {
  TODO: "neutral",
  IN_PROGRESS: "subtle",
  IN_REVIEW: "warning",
  DONE: "success",
};

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg } = useOrg();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentOrg) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<Issue>>(
          `/api/organizations/${currentOrg.id}/projects/${projectId}/issues`,
        );
        setIssues(res.data);
      } catch {
        setIssues([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentOrg, projectId]);

  async function handleCreateIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setError("");
    try {
      const issue = await apiFetch<Issue>(`/api/organizations/${currentOrg.id}/issues`, {
        method: "POST",
        body: JSON.stringify({ title, projectId }),
      });
      setIssues((prev) => [...prev, issue]);
      setTitle("");
      setCreating(false);
    } catch {
      setError("Could not create issue");
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4"
          >
            <ChevronLeft size={14} />
            Back to projects
          </Link>

          <div className="flex items-baseline justify-between mb-5">
            <h1 className="text-xl font-semibold tracking-tight text-text">Issues</h1>
            {!creating && (
              <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
                New issue
              </Button>
            )}
          </div>

          {creating && (
            <form onSubmit={handleCreateIssue} className="mb-5 flex gap-2">
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title"
                required
              />
              <Button type="submit" size="sm">
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreating(false);
                  setTitle("");
                }}
              >
                Cancel
              </Button>
            </form>
          )}
          {error && <p className="text-danger text-sm mb-4">{error}</p>}

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="p-3">
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : issues.length === 0 ? (
            <Card className="border-dashed px-8 py-14 text-center">
              <ListTodo size={26} className="mx-auto text-text-subtle mb-3" />
              <p className="text-text-muted">No issues yet.</p>
              <p className="text-sm text-text-subtle mt-1">
                Add your first issue to start tracking work on this project.
              </p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <Link
                    href={`/dashboard/projects/${projectId}/issues/${issue.id}`}
                  >
                    <Card className="group flex items-center justify-between px-4 py-3 hover:border-border-hover hover:shadow-xs transition-all duration-normal">
                      <span className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
                        {issue.title}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        {issue.assignee && (
                          <Avatar name={issue.assignee.name} size="sm" tone="subtle" />
                        )}
                        <Badge variant={STATUS_BADGE[issue.status]}>
                          {ISSUE_STATUSES.find((s) => s.value === issue.status)?.label}
                        </Badge>
                        <ChevronRight
                          size={15}
                          className="text-text-subtle group-hover:text-primary transition-colors"
                        />
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
