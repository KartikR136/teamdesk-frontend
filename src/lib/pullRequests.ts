import { apiFetch } from "./api";
import type { PullRequest, PRStatus, PRReviewStatus } from "@/types";

// Thin, typed wrappers around the pull-requests endpoints — mirrors the
// pattern lib/meetings.ts uses: no separate "service" abstraction, just
// typed apiFetch calls colocated by resource.

export interface CreatePullRequestInput {
  title: string;
  description?: string;
  repoName: string;
  sourceBranch: string;
  targetBranch?: string;
  externalUrl?: string;
  filesChanged?: number;
  linesAdded?: number;
  linesRemoved?: number;
  projectId?: string | null;
  reviewerUserIds?: string[];
  linkedIssueIds?: string[];
}

export function createPullRequest(
  organizationId: string,
  input: CreatePullRequestInput,
) {
  return apiFetch<PullRequest>(
    `/api/organizations/${organizationId}/pull-requests`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function listPullRequests(
  organizationId: string,
  params: {
    status?: PRStatus;
    projectId?: string;
    authorId?: string;
    reviewerId?: string;
    limit?: number;
    cursor?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.projectId) query.set("projectId", params.projectId);
  if (params.authorId) query.set("authorId", params.authorId);
  if (params.reviewerId) query.set("reviewerId", params.reviewerId);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return apiFetch<{
    data: PullRequest[];
    hasNextPage: boolean;
    nextCursor: string | null;
  }>(
    `/api/organizations/${organizationId}/pull-requests${qs ? `?${qs}` : ""}`,
  );
}

export function getPullRequest(pullRequestId: string, signal?: AbortSignal) {
  return apiFetch<PullRequest>(`/api/pull-requests/${pullRequestId}`, {
    signal,
  });
}

export interface UpdatePullRequestInput {
  title?: string;
  description?: string | null;
  targetBranch?: string;
  mergeStatus?: "CLEAN" | "CONFLICTS" | "CHECKS_FAILING";
  filesChanged?: number;
  linesAdded?: number;
  linesRemoved?: number;
  externalUrl?: string | null;
  projectId?: string | null;
}

export function updatePullRequest(
  pullRequestId: string,
  input: UpdatePullRequestInput,
) {
  return apiFetch<PullRequest>(`/api/pull-requests/${pullRequestId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePullRequest(pullRequestId: string) {
  return apiFetch<void>(`/api/pull-requests/${pullRequestId}`, {
    method: "DELETE",
  });
}

export function requestReviewers(pullRequestId: string, userIds: string[]) {
  return apiFetch<PullRequest>(
    `/api/pull-requests/${pullRequestId}/reviewers`,
    { method: "POST", body: JSON.stringify({ userIds }) },
  );
}

export function removeReviewer(pullRequestId: string, userId: string) {
  return apiFetch<void>(
    `/api/pull-requests/${pullRequestId}/reviewers/${userId}`,
    { method: "DELETE" },
  );
}

export function submitReview(
  pullRequestId: string,
  status: Exclude<PRReviewStatus, "PENDING">,
  comment?: string,
) {
  return apiFetch(`/api/pull-requests/${pullRequestId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status, comment }),
  });
}

export function mergePullRequest(pullRequestId: string, force = false) {
  return apiFetch<PullRequest>(`/api/pull-requests/${pullRequestId}/merge`, {
    method: "POST",
    body: JSON.stringify({ force }),
  });
}

export function closePullRequest(pullRequestId: string) {
  return apiFetch<PullRequest>(`/api/pull-requests/${pullRequestId}/close`, {
    method: "POST",
  });
}

export function reopenPullRequest(pullRequestId: string) {
  return apiFetch<PullRequest>(`/api/pull-requests/${pullRequestId}/reopen`, {
    method: "POST",
  });
}

export function linkIssueToPullRequest(pullRequestId: string, issueId: string) {
  return apiFetch(`/api/pull-requests/${pullRequestId}/issues`, {
    method: "POST",
    body: JSON.stringify({ issueId }),
  });
}

export function unlinkIssueFromPullRequest(
  pullRequestId: string,
  issueId: string,
) {
  return apiFetch<void>(
    `/api/pull-requests/${pullRequestId}/issues/${issueId}`,
    { method: "DELETE" },
  );
}

export function listPullRequestComments(pullRequestId: string) {
  return apiFetch<{ data: import("@/types").PullRequestComment[] }>(
    `/api/pull-requests/${pullRequestId}/comments`,
  );
}

export function createPullRequestComment(pullRequestId: string, body: string) {
  return apiFetch(`/api/pull-requests/${pullRequestId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
