"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { isAbortError } from "@/lib/api";
import {
  listNotifications,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notificationsApi";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import {
  NOTIFICATION_VISUALS,
  relativeTime,
} from "@/components/notifications/notificationVisuals";

function NotificationRow({
  entry,
  index,
  onRead,
}: {
  entry: NotificationItem;
  index: number;
  onRead: (id: string) => void;
}) {
  const visual = NOTIFICATION_VISUALS[entry.type];
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      onClick={() => !entry.read && onRead(entry.id)}
      className={cn(
        "flex items-start gap-2.5 py-2.5 px-2 -mx-2 rounded-md hover:bg-surface-hover transition-colors duration-fast cursor-pointer",
      )}
    >
      <span
        className={cn(
          "h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
          visual.color,
        )}
      >
        {visual.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text leading-snug">
          <span className="font-medium">{entry.actorName}</span>{" "}
          {entry.message}
        </p>
        <span className="text-xs text-text-subtle">
          {relativeTime(entry.createdAt)}
        </span>
      </div>
      {!entry.read && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0"
          aria-label="Unread"
        />
      )}
    </motion.div>
  );
}

export function NotificationsCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        const res = await listNotifications({ limit: 8 }, controller.signal);
        if (controller.signal.aborted) return;
        setNotifications(res.data);
        setStatus(res.data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  // Live push keeps this widget in sync with the header bell / full
  // notification center without any of the three needing to know about
  // each other — they all just independently subscribe to the same SSE
  // stream and reconcile local state.
  useNotificationStream((notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 8));
    setStatus("ready");
  });

  const handleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    markNotificationRead(id).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <WidgetCard
      title="Notifications"
      icon={<Bell size={15} />}
      headerAction={
        unreadCount > 0 ? (
          <span className="text-xs font-medium text-primary bg-primary-subtle px-2 py-0.5 rounded-full">
            {unreadCount} unread
          </span>
        ) : (
          <Link
            href="/dashboard/notifications"
            className="text-xs font-medium text-text-subtle hover:text-text transition-colors"
          >
            View all
          </Link>
        )
      }
      status={status}
      onRetry={() => setStatus("loading")}
      skeleton={
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="h-6 w-6 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-4/5 mb-1.5" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      }
      emptyState={
        <EmptyState
          icon={<Bell size={26} />}
          title="You're all caught up"
          description="New activity on your issues, decisions, and PRs will show up here."
          compact
        />
      }
      contentClassName="divide-y divide-border -my-1"
    >
      {notifications.map((n, i) => (
        <NotificationRow key={n.id} entry={n} index={i} onRead={handleRead} />
      ))}
    </WidgetCard>
  );
}
