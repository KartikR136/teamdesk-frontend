"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  UserPlus,
  MessageSquare,
  CheckCircle2,
  AtSign,
  Rocket,
  GitMerge,
} from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  getMockDashboardData,
  type DashboardNotification,
  type NotificationKind,
} from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";

// Same icon-badge + relative-time visual language ActivityFeed already
// established elsewhere in the app — kept consistent rather than
// inventing a new notification-icon style just for this widget.
const KIND_CONFIG: Record<
  NotificationKind,
  { icon: React.ReactNode; color: string }
> = {
  ISSUE_ASSIGNED: {
    icon: <UserPlus size={13} />,
    color: "text-primary bg-primary-subtle",
  },
  COMMENT_ADDED: {
    icon: <MessageSquare size={13} />,
    color: "text-text-muted bg-surface-hover",
  },
  DECISION_APPROVED: {
    icon: <CheckCircle2 size={13} />,
    color: "text-success bg-success-subtle",
  },
  MENTIONED: {
    icon: <AtSign size={13} />,
    color: "text-warning bg-warning-subtle",
  },
  DEPLOYMENT_COMPLETED: {
    icon: <Rocket size={13} />,
    color: "text-primary bg-primary-subtle",
  },
  PR_MERGED: {
    icon: <GitMerge size={13} />,
    color: "text-success bg-success-subtle",
  },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationRow({
  entry,
  index,
}: {
  entry: DashboardNotification;
  index: number;
}) {
  const cfg = KIND_CONFIG[entry.kind];
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      className={cn(
        "flex items-start gap-2.5 py-2.5 px-2 -mx-2 rounded-md hover:bg-surface-hover transition-colors duration-fast",
      )}
    >
      <span
        className={cn(
          "h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
          cfg.color,
        )}
      >
        {cfg.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text leading-snug">
          <span className="font-medium">{entry.actorName}</span> {entry.message}
          {entry.groupCount && entry.groupCount > 1 && (
            <span className="text-text-subtle">
              {" "}
              and {entry.groupCount - 1} more
            </span>
          )}
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
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` and read `.notifications` from the response.
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted) return;
        const data = getMockDashboardData().notifications;
        setNotifications(data);
        setStatus(data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

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
        ) : undefined
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
        <NotificationRow key={n.id} entry={n} index={i} />
      ))}
    </WidgetCard>
  );
}
