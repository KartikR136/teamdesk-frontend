"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import * as RadixPopover from "@radix-ui/react-popover";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  type NotificationItem,
} from "@/lib/notificationsApi";
import { isAbortError } from "@/lib/api";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { NOTIFICATION_VISUALS, relativeTime } from "./notificationVisuals";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshCount = useCallback(() => {
    getUnreadCount()
      .then((r) => setUnreadCount(r.count))
      .catch(() => {});
  }, []);

  // Initial + poll fallback: SSE covers the common case (tab stays open),
  // this covers reconnect gaps and any environment where SSE is blocked
  // by a corporate proxy.
  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 60_000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Real-time push: a brand new notification bumps the badge instantly
  // and, if the panel happens to be open, prepends it to the visible list.
  // Also surfaces a toast so notifications are noticed even when the user
  // isn't looking at the bell at all — same useNotify() channel the rest
  // of the app already uses for action feedback.
  useNotificationStream((notification) => {
    setUnreadCount((c) => c + 1);
    setItems((prev) =>
      open ? [notification, ...prev].slice(0, 20) : prev,
    );
    const visual = NOTIFICATION_VISUALS[notification.type];
    toast({
      title: notification.actorName,
      description: notification.message,
      variant: "default",
    });
    void visual; // reserved for a future toast icon slot
  });

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    listNotifications({ limit: 8 }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setItems(res.data);
      })
      .catch((err) => {
        if (!isAbortError(err)) console.error(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open]);

  const handleMarkRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      refreshCount();
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllRead();
    } catch {
      refreshCount();
    }
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        <button
          className="relative h-8 w-8 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-fast"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute top-1 right-1 h-2 w-2 rounded-full bg-primary",
                "ring-2 ring-surface",
              )}
              aria-hidden
            />
          )}
        </button>
      </RadixPopover.Trigger>

      <RadixPopover.Portal>
        <RadixPopover.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-dropdown w-80 max-h-[28rem] flex flex-col overflow-hidden",
            "rounded-lg border border-border bg-surface shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          )}
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span className="text-sm font-semibold text-text">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin text-text-subtle" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<Bell size={22} />}
                title="You're all caught up"
                description="New activity will show up here."
                compact
              />
            ) : (
              <AnimatePresence initial={false}>
                {items.map((n) => {
                  const visual = NOTIFICATION_VISUALS[n.type];
                  return (
                    <motion.button
                      key={n.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => !n.read && handleMarkRead(n.id)}
                      className={cn(
                        "w-full flex items-start gap-2.5 px-3 py-2.5 text-left",
                        "hover:bg-surface-hover transition-colors duration-fast",
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
                          <span className="font-medium">{n.actorName}</span>{" "}
                          {n.message}
                        </p>
                        <span className="text-xs text-text-subtle">
                          {relativeTime(n.createdAt)}
                        </span>
                      </div>
                      {!n.read && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0"
                          aria-label="Unread"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-medium text-primary hover:text-primary-hover py-2.5 border-t border-border transition-colors"
          >
            View all notifications
          </Link>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
