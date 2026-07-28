"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Trash2, Loader2, CheckCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  listNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllRead,
  deleteNotification,
  type NotificationItem,
} from "@/lib/notificationsApi";
import { isAbortError } from "@/lib/api";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import {
  NOTIFICATION_VISUALS,
  relativeTime,
} from "@/components/notifications/notificationVisuals";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "unread";

export default function NotificationsPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [view, setView] = useState<"inbox" | "settings">("inbox");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const { toast } = useToast();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    (opts: { reset: boolean }, signal?: AbortSignal) => {
      setStatus(opts.reset ? "loading" : status);
      listNotifications(
        {
          limit: 20,
          unread: tab === "unread" ? true : undefined,
          cursor: opts.reset ? undefined : (cursor ?? undefined),
        },
        signal,
      )
        .then((res) => {
          if (signal?.aborted) return;
          setItems((prev) => (opts.reset ? res.data : [...prev, ...res.data]));
          setHasNextPage(res.hasNextPage);
          setCursor(res.nextCursor);
          setStatus("ready");
        })
        .catch((err) => {
          if (isAbortError(err)) return;
          setStatus("error");
        })
        .finally(() => setLoadingMore(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab],
  );

  // Reset + reload whenever the filter tab changes.
  useEffect(() => {
    const controller = new AbortController();
    setCursor(null);
    load({ reset: true }, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Infinite scroll via IntersectionObserver on a bottom sentinel — same
  // pattern as any cursor-paginated list in this app, just implemented
  // locally since this is the first list screen to need it client-side.
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasNextPage) {
          setLoadingMore(true);
          load({ reset: false });
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, load]);

  // Live updates: a new notification while viewing "All" is prepended
  // immediately; while viewing "Unread" it's equally valid to prepend
  // since it's, by definition, unread.
  useNotificationStream((notification) => {
    setItems((prev) => [notification, ...prev]);
  });

  const unreadVisible = items.some((n) => !n.read);

  const handleToggleRead = async (n: NotificationItem) => {
    const nextRead = !n.read;
    setItems((prev) =>
      prev.map((item) =>
        item.id === n.id ? { ...item, read: nextRead } : item,
      ),
    );
    try {
      await (nextRead
        ? markNotificationRead(n.id)
        : markNotificationUnread(n.id));
    } catch {
      toast({
        title: "Couldn't update notification",
        variant: "danger",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const prevItems = items;
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch {
      setItems(prevItems);
      toast({ title: "Couldn't delete notification", variant: "danger" });
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllRead();
      toast({ title: "All notifications marked as read", variant: "success" });
    } catch {
      toast({ title: "Couldn't mark all as read", variant: "danger" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-text tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Everything assigned to, mentioned, or affecting you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView(view === "inbox" ? "settings" : "inbox")}
          >
            {view === "inbox" ? "Preferences" : "Back to inbox"}
          </Button>
        </div>
      </div>

      {view === "settings" ? (
        <NotificationPreferences />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
              </TabsList>
            </Tabs>

            {unreadVisible && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck size={14} />
                Mark all read
              </Button>
            )}
          </div>

          {status === "loading" ? (
            <div className="space-y-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3 px-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : status === "error" ? (
            <EmptyState
              icon={<Bell size={26} />}
              title="Couldn't load notifications"
              description="Something went wrong. Try again."
              action={
                <Button size="sm" onClick={() => load({ reset: true })}>
                  Retry
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Bell size={26} />}
              title={tab === "unread" ? "No unread notifications" : "You're all caught up"}
              description="New activity on your issues, decisions, and PRs will show up here."
            />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden bg-surface">
              {items.map((n) => {
                const visual = NOTIFICATION_VISUALS[n.type];
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group flex items-start gap-3 px-3 py-3 transition-colors duration-fast",
                      !n.read && "bg-primary-subtle/30",
                    )}
                  >
                    <span
                      className={cn(
                        "h-8 w-8 rounded-md flex items-center justify-center shrink-0 mt-0.5",
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-subtle">
                          {relativeTime(n.createdAt)}
                        </span>
                        <span className="text-xs text-text-subtle">·</span>
                        <span className="text-xs text-text-subtle">
                          {visual.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleToggleRead(n)}
                        className="text-xs font-medium text-primary hover:text-primary-hover px-2 py-1 rounded-md hover:bg-surface-hover"
                      >
                        {n.read ? "Mark unread" : "Mark read"}
                      </button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        aria-label="Dismiss notification"
                        className="h-7 w-7 flex items-center justify-center rounded-md text-text-subtle hover:text-danger hover:bg-danger-subtle transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {!n.read && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"
                        aria-label="Unread"
                      />
                    )}
                  </div>
                );
              })}

              <div ref={sentinelRef} />
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-text-subtle" />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
