"use client";

import { useEffect, useRef } from "react";
import type { NotificationItem } from "@/lib/notificationsApi";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Subscribes to GET /api/notifications/stream (SSE) for as long as the
 * calling component is mounted, and invokes `onEvent` for every new
 * notification pushed in real time.
 *
 * Auth: EventSource can't send custom headers, but it does send cookies
 * when built with `withCredentials: true` — the backend's requireAuth
 * middleware already reads the accessToken cookie, so no extra plumbing
 * is needed here.
 *
 * Reconnection: the browser's native EventSource auto-reconnects on a
 * dropped connection using the `retry:` hint the server sends, so this
 * hook doesn't need its own retry/backoff logic — just clean teardown on
 * unmount.
 */
export function useNotificationStream(
  onEvent: (notification: NotificationItem) => void,
  enabled = true,
) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !BASE_URL) return;

    const source = new EventSource(`${BASE_URL}/api/notifications/stream`, {
      withCredentials: true,
    });

    source.addEventListener("notification", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        handlerRef.current({
          id: parsed.id,
          type: parsed.type,
          message: parsed.message,
          read: parsed.read,
          createdAt: parsed.createdAt,
          actorName: parsed.actorName,
          issueId: null,
          pullRequestId: null,
          deploymentId: null,
          buildRunId: null,
        });
      } catch {
        // Malformed event — ignore rather than crash the stream handler.
      }
    });

    // Swallow connection errors silently; EventSource retries on its own,
    // and a transient drop (deploy, laptop sleep, etc.) isn't worth
    // surfacing to the user as an error toast.
    source.onerror = () => {};

    return () => {
      source.close();
    };
  }, [enabled]);
}
