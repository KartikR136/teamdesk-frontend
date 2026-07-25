"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { apiFetch } from "@/lib/api";
import type {
  Issue,
  Meeting,
  MeetingKind,
  Member,
  PaginatedResponse,
  Project,
  RecurrenceRule,
} from "@/types";
import { MEETING_KINDS, RECURRENCE_RULES } from "@/types";

export interface MeetingFormValues {
  title: string;
  kind: MeetingKind;
  description: string;
  startDate: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  durationMinutes: number;
  location: string;
  projectId: string;
  attendeeUserIds: string[];
  linkedIssueIds: string[];
  recurrenceRule: RecurrenceRule;
  occurrenceCount: number;
}

function toFormValues(meeting?: Meeting): MeetingFormValues {
  const starts = meeting ? new Date(meeting.startsAt) : new Date();
  if (!meeting) starts.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    title: meeting?.title ?? "",
    kind: meeting?.kind ?? "STANDUP",
    description: meeting?.description ?? "",
    startDate: `${starts.getFullYear()}-${pad(starts.getMonth() + 1)}-${pad(starts.getDate())}`,
    startTime: `${pad(starts.getHours())}:${pad(starts.getMinutes())}`,
    durationMinutes: meeting?.durationMinutes ?? 30,
    location: meeting?.location ?? "",
    projectId: meeting?.projectId ?? "",
    attendeeUserIds: meeting?.attendees.map((a) => a.user.id) ?? [],
    linkedIssueIds: meeting?.linkedIssues.map((l) => l.issue.id) ?? [],
    recurrenceRule: meeting?.recurrenceRule ?? "NONE",
    occurrenceCount: 8,
  };
}

/** Converts form values into the ISO startsAt the API expects. */
export function formValuesToStartsAt(values: MeetingFormValues): string {
  return new Date(`${values.startDate}T${values.startTime}:00`).toISOString();
}

/**
 * Shared create/edit form for meetings. Mirrors DecisionForm.tsx's exact
 * structure (Textarea-alike local component, project select loaded from
 * the org's first page, checkbox lists for many-to-many relations) so
 * this codebase's two "org-scoped resource with linked issues" forms
 * stay visually and behaviorally consistent.
 */
export function MeetingForm({
  organizationId,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  organizationId: string;
  initial?: Meeting;
  submitLabel: string;
  onSubmit: (values: MeetingFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<MeetingFormValues>(() =>
    toFormValues(initial),
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Same "first page only, honestly labeled" convention DecisionForm.tsx
  // established — no server-side search to page through everything here.
  useEffect(() => {
    void (async () => {
      try {
        const [projectsRes, membersRes, issuesRes] = await Promise.all([
          apiFetch<PaginatedResponse<Project>>(
            `/api/organizations/${organizationId}/projects`,
          ),
          apiFetch<PaginatedResponse<Member>>(
            `/api/organizations/${organizationId}/members`,
          ),
          apiFetch<PaginatedResponse<Issue>>(
            `/api/organizations/${organizationId}/issues`,
          ),
        ]);
        setProjects(projectsRes.data);
        setMembers(membersRes.data);
        setIssues(issuesRes.data);
      } catch {
        setProjects([]);
        setMembers([]);
        setIssues([]);
      }
    })();
  }, [organizationId]);

  function update<K extends keyof MeetingFormValues>(
    key: K,
    value: MeetingFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAttendee(userId: string) {
    setValues((prev) => ({
      ...prev,
      attendeeUserIds: prev.attendeeUserIds.includes(userId)
        ? prev.attendeeUserIds.filter((id) => id !== userId)
        : [...prev.attendeeUserIds, userId],
    }));
  }

  function toggleIssue(issueId: string) {
    setValues((prev) => ({
      ...prev,
      linkedIssueIds: prev.linkedIssueIds.includes(issueId)
        ? prev.linkedIssueIds.filter((id) => id !== issueId)
        : [...prev.linkedIssueIds, issueId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch {
      setError("Could not save this meeting. Please check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField
        label="Title"
        value={values.title}
        onChange={(e) => update("title", e.target.value)}
        maxLength={200}
        required
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="meeting-kind" className="text-sm font-medium text-text">
            Type
          </label>
          <select
            id="meeting-kind"
            value={values.kind}
            onChange={(e) => update("kind", e.target.value as MeetingKind)}
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover transition-colors duration-normal"
          >
            {MEETING_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="meeting-project" className="text-sm font-medium text-text">
            Related project (optional)
          </label>
          <select
            id="meeting-project"
            value={values.projectId}
            onChange={(e) => update("projectId", e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover transition-colors duration-normal"
          >
            <option value="">No related project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <FormField
          label="Date"
          type="date"
          value={values.startDate}
          onChange={(e) => update("startDate", e.target.value)}
          required
        />
        <FormField
          label="Time"
          type="time"
          value={values.startTime}
          onChange={(e) => update("startTime", e.target.value)}
          required
        />
        <FormField
          label="Duration (min)"
          type="number"
          min={5}
          max={480}
          value={values.durationMinutes}
          onChange={(e) => update("durationMinutes", Number(e.target.value))}
          required
        />
      </div>

      <FormField
        label="Location or video link (optional)"
        value={values.location}
        onChange={(e) => update("location", e.target.value)}
        maxLength={500}
        placeholder="Room 4B, or https://meet.google.com/..."
      />

      {/* Recurrence is only offered on create — editing an existing
          occurrence edits just that one row, matching the backend's own
          split between POST (can generate a series) and PATCH (single
          row only). */}
      {!initial && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="meeting-recurrence" className="text-sm font-medium text-text">
              Repeats
            </label>
            <select
              id="meeting-recurrence"
              value={values.recurrenceRule}
              onChange={(e) =>
                update("recurrenceRule", e.target.value as RecurrenceRule)
              }
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover transition-colors duration-normal"
            >
              {RECURRENCE_RULES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {values.recurrenceRule !== "NONE" && (
            <FormField
              label="Number of occurrences"
              type="number"
              min={1}
              max={52}
              value={values.occurrenceCount}
              onChange={(e) => update("occurrenceCount", Number(e.target.value))}
            />
          )}
        </div>
      )}

      {members.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text mb-1.5">Attendees</p>
          <p className="text-xs text-text-subtle mb-2">
            You&apos;re always included automatically.
          </p>
          <div className="border border-border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
            {members.map((m) => (
              <label
                key={m.userId}
                className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={values.attendeeUserIds.includes(m.userId)}
                  onChange={() => toggleAttendee(m.userId)}
                  className="accent-primary"
                />
                <span className="text-text truncate">{m.user.name}</span>
                <span className="text-text-subtle text-xs ml-auto shrink-0">
                  {m.role}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text mb-1.5">
            Link issues to discuss (optional)
          </p>
          <p className="text-xs text-text-subtle mb-2">
            Only issues from already-loaded pages are shown here.
          </p>
          <div className="border border-border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
            {issues.map((issue) => (
              <label
                key={issue.id}
                className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={values.linkedIssueIds.includes(issue.id)}
                  onChange={() => toggleIssue(issue.id)}
                  className="accent-primary"
                />
                <span className="text-text truncate">{issue.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
