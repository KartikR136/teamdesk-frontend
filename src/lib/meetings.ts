import { apiFetch } from "./api";
import type {
  Meeting,
  MeetingKind,
  RecurrenceRule,
  MeetingRsvpStatus,
} from "@/types";

// Thin, typed wrappers around the meetings endpoints — mirrors the
// pattern every other resource in this codebase uses (decisions.ts,
// activity.ts): no separate "service" abstraction, just typed apiFetch
// calls colocated by resource so call sites don't hand-construct URLs
// or response shapes themselves.

export interface CreateMeetingInput {
  title: string;
  kind?: MeetingKind;
  description?: string;
  startsAt: string; // ISO
  durationMinutes?: number;
  location?: string;
  projectId?: string | null;
  attendeeUserIds?: string[];
  linkedIssueIds?: string[];
  recurrenceRule?: RecurrenceRule;
  occurrenceCount?: number;
}

export function createMeeting(organizationId: string, input: CreateMeetingInput) {
  return apiFetch<Meeting | { series: Meeting[] }>(
    `/api/organizations/${organizationId}/meetings`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function listMeetings(
  organizationId: string,
  params: { from?: string; to?: string; projectId?: string; limit?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.projectId) query.set("projectId", params.projectId);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<{ data: Meeting[] }>(
    `/api/organizations/${organizationId}/meetings${qs ? `?${qs}` : ""}`,
  );
}

export function getMeeting(meetingId: string, signal?: AbortSignal) {
  return apiFetch<Meeting>(`/api/meetings/${meetingId}`, { signal });
}

export interface UpdateMeetingInput {
  title?: string;
  kind?: MeetingKind;
  description?: string | null;
  startsAt?: string;
  durationMinutes?: number;
  location?: string | null;
  projectId?: string | null;
}

export function updateMeeting(meetingId: string, input: UpdateMeetingInput) {
  return apiFetch<Meeting>(`/api/meetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteMeeting(meetingId: string, scope: "single" | "series" = "single") {
  return apiFetch<void>(
    `/api/meetings/${meetingId}${scope === "series" ? "?scope=series" : ""}`,
    { method: "DELETE" },
  );
}

export function rsvpToMeeting(meetingId: string, status: MeetingRsvpStatus) {
  return apiFetch(`/api/meetings/${meetingId}/rsvp`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateMeetingNotes(meetingId: string, notes: string | null) {
  return apiFetch<Meeting>(`/api/meetings/${meetingId}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

export function linkIssueToMeeting(meetingId: string, issueId: string) {
  return apiFetch(`/api/meetings/${meetingId}/issues`, {
    method: "POST",
    body: JSON.stringify({ issueId }),
  });
}

export function unlinkIssueFromMeeting(meetingId: string, issueId: string) {
  return apiFetch<void>(`/api/meetings/${meetingId}/issues/${issueId}`, {
    method: "DELETE",
  });
}
