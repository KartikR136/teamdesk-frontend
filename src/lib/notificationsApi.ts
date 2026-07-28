import { apiFetch } from "@/lib/api";

// Backend's full NotificationType enum (src/lib/notifications.ts on the
// backend) — a superset of the dashboard mock's 6-value NotificationKind.
// The full type is exposed here (rather than remapped down to 6 values)
// so the dedicated Notification Center page and preferences screen can
// distinguish e.g. DEPLOYMENT_SUCCEEDED from DEPLOYMENT_FAILED, which the
// dashboard widget's icon-only treatment collapses together.
export type NotificationType =
  | "MENTION"
  | "COMMENT"
  | "ASSIGNMENT"
  | "STATUS_CHANGE"
  | "ORG_EVENT"
  | "PR_REVIEW_REQUESTED"
  | "PR_REVIEW_SUBMITTED"
  | "PR_MERGED"
  | "DEPLOYMENT_SUCCEEDED"
  | "DEPLOYMENT_FAILED"
  | "BUILD_FAILED"
  | "BUILD_FIXED";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  actorName: string;
  issueId: string | null;
  pullRequestId: string | null;
  deploymentId: string | null;
  buildRunId: string | null;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
}

export function listNotifications(
  params: { cursor?: string; limit?: number; unread?: boolean } = {},
  signal?: AbortSignal,
): Promise<NotificationListResponse> {
  const qs = new URLSearchParams();
  if (params.cursor) qs.set("cursor", params.cursor);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.unread !== undefined) qs.set("unread", String(params.unread));
  const query = qs.toString();
  return apiFetch<NotificationListResponse>(
    `/api/notifications${query ? `?${query}` : ""}`,
    { signal },
  );
}

export function getUnreadCount(signal?: AbortSignal): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/api/notifications/unread-count", {
    signal,
  });
}

export function markNotificationRead(id: string): Promise<null> {
  return apiFetch<null>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function markNotificationUnread(id: string): Promise<null> {
  return apiFetch<null>(`/api/notifications/${id}/unread`, {
    method: "PATCH",
  });
}

export function markAllRead(type?: NotificationType): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>("/api/notifications/read-all", {
    method: "POST",
    body: JSON.stringify(type ? { type } : {}),
  });
}

export function deleteNotification(id: string): Promise<null> {
  return apiFetch<null>(`/api/notifications/${id}`, { method: "DELETE" });
}

export function getNotificationPreferences(): Promise<{
  data: NotificationPreference[];
}> {
  return apiFetch<{ data: NotificationPreference[] }>(
    "/api/notifications/preferences",
  );
}

export function setNotificationPreferences(
  prefs: NotificationPreference[],
): Promise<{ data: NotificationPreference[] }> {
  return apiFetch<{ data: NotificationPreference[] }>(
    "/api/notifications/preferences",
    { method: "PUT", body: JSON.stringify(prefs) },
  );
}
