"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ListTodo, Plus,
  Circle, Zap, GitBranch, CheckCircle2, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { ISSUE_STATUSES, type Issue, type IssuePriority, type PaginatedResponse } from "@/types";

const STATUS_CONFIG: Record<Issue["status"], {
  icon: React.ReactNode; label: string;
  badge: "neutral" | "subtle" | "warning" | "success";
}> = {
  TODO:        { icon: <Circle size={13} />,        label: "To Do",       badge: "neutral" },
  IN_PROGRESS: { icon: <Zap size={13} />,            label: "In Progress", badge: "subtle" },
  IN_REVIEW:   { icon: <GitBranch size={13} />,      label: "In Review",   badge: "warning" },
  DONE:        { icon: <CheckCircle2 size={13} />,   label: "Done",        badge: "success" },
};

const PRIORITY_DOT: Record<IssuePriority, string> = {
  URGENT: "bg-danger",
  HIGH:   "bg-warning",
  MEDIUM: "bg-primary",
  LOW:    "bg-text-subtle",
};

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  URGENT: "Urgent", HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg } = useOrg();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!currentOrg) return;
    setLoading(true);
    apiFetch<PaginatedResponse<Issue>>(
      `/api/organizations/${currentOrg.id}/projects/${projectId}/issues`,
    )
      .then((res) => setIssues(res.data))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false));
  }, [currentOrg, projectId]);

  async function handleCreateIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setCreateError("");
    try {
      const issue = await apiFetch<Issue>(`/api/organizations/${currentOrg.id}/issues`, {
        method: "POST",
        body: JSON.stringify({ title, projectId }),
      });
      setIssues((prev) => [issue, ...prev]);
      setTitle("");
      setCreating(false);
    } catch {
      setCreateError("Could not create issue — check your permissions.");
    }
  }

  const canCreate = currentOrg && ["ADMIN", "MANAGER", "MEMBER"].includes(currentOrg.role);

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-5"
          >
            <ChevronLeft size={14} />
            Back to dashboard
          </Link>

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text">Issues</h1>
              <p className="text-sm text-text-muted mt-0.5">
                {issues.length} {issues.length === 1 ? "issue" : "issues"}
              </p>
            </div>
            {canCreate && !creating && (
              <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreating(true)}>
                New issue
              </Button>
            )}
          </div>

          {/* Create form */}
          <AnimatePresence>
            {creating && (
              <motion.form
                onSubmit={handleCreateIssue}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-5"
              >
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Describe the issue…"
                    required
                  />
                  <Button type="submit" size="sm">Add</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setCreating(false); setTitle(""); }}>
                    Cancel
                  </Button>
                </div>
                {createError && (
                  <p className="flex items-center gap-1.5 text-xs text-danger mt-2">
                    <AlertCircle size={12} />{createError}
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          {/* Issue list */}
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
                  <Skeleton className="h-4 w-4 rounded-full" round />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-pill" />
                </div>
              ))}
            </div>
          ) : issues.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<ListTodo size={30} />}
                title="No issues yet"
                description="Create your first issue to start tracking work on this project."
                action={canCreate ? (
                  <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreating(true)}>
                    New issue
                  </Button>
                ) : undefined}
              />
            </EmptyStateCard>
          ) : (
            <ul className="space-y-1.5">
              {issues.map((issue, i) => {
                const sc = STATUS_CONFIG[issue.status];
                return (
                  <motion.li
                    key={issue.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                  >
                    <Link href={`/dashboard/projects/${projectId}/issues/${issue.id}`}>
                      <div className={cn(
                        "group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3",
                        "hover:border-border-hover hover:shadow-sm hover:-translate-y-px",
                        "transition-all duration-normal",
                      )}>
                        {/* Status icon */}
                        <span className={cn(
                          "shrink-0 transition-colors duration-fast",
                          issue.status === "DONE" ? "text-success" :
                          issue.status === "IN_REVIEW" ? "text-warning" :
                          issue.status === "IN_PROGRESS" ? "text-primary" : "text-text-subtle",
                        )}>
                          {sc.icon}
                        </span>

                        {/* Title */}
                        <span className="flex-1 text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
                          {issue.title}
                        </span>

                        {/* Meta */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {(issue as Issue & { priority?: IssuePriority }).priority && (
                            <span
                              className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[(issue as Issue & { priority: IssuePriority }).priority])}
                              title={PRIORITY_LABEL[(issue as Issue & { priority: IssuePriority }).priority]}
                            />
                          )}
                          {issue.assignee && (
                            <Avatar name={issue.assignee.name} size="sm" tone="subtle" />
                          )}
                          <Badge variant={sc.badge} className="text-[11px]">
                            {ISSUE_STATUSES.find((s) => s.value === issue.status)?.label}
                          </Badge>
                          <ChevronRight
                            size={14}
                            className="text-text-subtle group-hover:text-primary transition-all group-hover:translate-x-0.5"
                          />
                        </div>
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
