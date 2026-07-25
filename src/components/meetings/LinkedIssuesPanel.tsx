"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { linkIssueToMeeting, unlinkIssueFromMeeting } from "@/lib/meetings";
import type { Issue, MeetingLinkedIssue, PaginatedResponse } from "@/types";

const PRIORITY_VARIANT: Record<string, "danger" | "warning" | "info" | "neutral"> = {
  URGENT: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
};

/**
 * The "connect a task/issue to a meeting" capability — lets anyone with
 * MEMBER+ access attach existing issues to this meeting (for a sprint
 * planning session, incident review, etc.) or remove one that no longer
 * belongs. Backed by POST/DELETE /meetings/:id/issues[/:issueId].
 */
export function LinkedIssuesPanel({
  meetingId,
  organizationId,
  linkedIssues,
  onChange,
  canEdit,
}: {
  meetingId: string;
  organizationId: string;
  linkedIssues: MeetingLinkedIssue[];
  onChange: (linked: MeetingLinkedIssue[]) => void;
  canEdit: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const [availableIssues, setAvailableIssues] = useState<Issue[]>([]);
  const [busyIssueId, setBusyIssueId] = useState<string | null>(null);

  useEffect(() => {
    if (!picking) return;
    void (async () => {
      try {
        const res = await apiFetch<PaginatedResponse<Issue>>(
          `/api/organizations/${organizationId}/issues`,
        );
        setAvailableIssues(res.data);
      } catch {
        setAvailableIssues([]);
      }
    })();
  }, [picking, organizationId]);

  const linkedIds = new Set(linkedIssues.map((l) => l.issue.id));

  async function handleLink(issueId: string) {
    setBusyIssueId(issueId);
    try {
      await linkIssueToMeeting(meetingId, issueId);
      const issue = availableIssues.find((i) => i.id === issueId);
      if (issue) {
        onChange([
          ...linkedIssues,
          {
            id: `temp-${issueId}`,
            issue: {
              id: issue.id,
              title: issue.title,
              status: issue.status,
              priority: "MEDIUM",
            },
          },
        ]);
      }
    } finally {
      setBusyIssueId(null);
    }
  }

  async function handleUnlink(issueId: string) {
    setBusyIssueId(issueId);
    try {
      await unlinkIssueFromMeeting(meetingId, issueId);
      onChange(linkedIssues.filter((l) => l.issue.id !== issueId));
    } finally {
      setBusyIssueId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide flex items-center gap-1.5">
          <Link2 size={12} />
          Linked issues
        </h2>
        {canEdit && (
          <Button size="xs" variant="ghost" onClick={() => setPicking((p) => !p)}>
            <Plus size={12} />
            {picking ? "Done" : "Link an issue"}
          </Button>
        )}
      </div>

      {linkedIssues.length === 0 && !picking && (
        <p className="text-sm text-text-subtle">
          No issues linked yet — attach the tasks this meeting is about so
          they&apos;re easy to find later.
        </p>
      )}

      {linkedIssues.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {linkedIssues.map(({ issue }) => (
            <li
              key={issue.id}
              className="flex items-center gap-2 text-sm bg-surface-hover rounded-md px-3 py-2"
            >
              <Badge variant={PRIORITY_VARIANT[issue.priority] ?? "neutral"}>
                {issue.priority}
              </Badge>
              <Link
                href={`/dashboard/projects/${issue.projectId ?? ""}/issues/${issue.id}`}
                className="text-text hover:text-primary transition-colors truncate flex-1"
              >
                {issue.title}
              </Link>
              {canEdit && (
                <button
                  onClick={() => void handleUnlink(issue.id)}
                  disabled={busyIssueId === issue.id}
                  className="text-text-subtle hover:text-danger transition-colors shrink-0"
                  aria-label={`Unlink ${issue.title}`}
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {picking && (
        <div className="border border-border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
          {availableIssues
            .filter((i) => !linkedIds.has(i.id))
            .map((issue) => (
              <button
                key={issue.id}
                onClick={() => void handleLink(issue.id)}
                disabled={busyIssueId === issue.id}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                <Plus size={12} className="text-text-subtle shrink-0" />
                <span className="truncate">{issue.title}</span>
              </button>
            ))}
          {availableIssues.filter((i) => !linkedIds.has(i.id)).length === 0 && (
            <p className="text-xs text-text-subtle px-3 py-2">
              No more issues to link from already-loaded pages.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
