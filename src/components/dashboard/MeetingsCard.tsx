"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Users2,
  Presentation,
  ClipboardList,
  Rows3,
  Sparkle,
  RotateCcw,
} from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getMockDashboardData,
  type Meeting,
  type MeetingKind,
} from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";

const KIND_ICON: Record<MeetingKind, React.ReactNode> = {
  STANDUP: <Users2 size={13} />,
  SPRINT_PLANNING: <ClipboardList size={13} />,
  DESIGN_REVIEW: <Presentation size={13} />,
  BACKEND_SYNC: <Rows3 size={13} />,
  DEMO: <Sparkle size={13} />,
  RETROSPECTIVE: <RotateCcw size={13} />,
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSoon(dateStr: string): boolean {
  const diffMins = (new Date(dateStr).getTime() - Date.now()) / 60000;
  return diffMins >= 0 && diffMins <= 30;
}

function MeetingRow({ m, index }: { m: Meeting; index: number }) {
  const soon = isSoon(m.startsAt);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      className="flex items-center gap-3 py-2"
    >
      <div className="flex flex-col items-center w-14 shrink-0 text-center">
        <span className="text-sm font-semibold text-text tabular-nums">
          {formatTime(m.startsAt)}
        </span>
        {soon && (
          <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
            Soon
          </span>
        )}
      </div>
      <span className="h-6 w-6 rounded-md bg-primary-subtle text-primary flex items-center justify-center shrink-0">
        {KIND_ICON[m.kind]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{m.title}</p>
        <p className="text-xs text-text-subtle">
          {m.durationMinutes}min · {m.attendeeCount} attendees
        </p>
      </div>
    </motion.div>
  );
}

export function MeetingsCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` and read `.meetings` — likely backed by a calendar
        // integration (Google/Outlook) server-side.
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted) return;
        const data = getMockDashboardData().meetings;
        setMeetings(data);
        setStatus(data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <WidgetCard
      title="Today's Meetings"
      icon={<CalendarClock size={15} />}
      status={status}
      onRetry={() => setStatus("loading")}
      skeleton={
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-6 w-6 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      }
      emptyState={
        <EmptyState
          icon={<CalendarClock size={26} />}
          title="No meetings today"
          description="Once calendar sync is connected, today's schedule shows up here."
          compact
        />
      }
      contentClassName="divide-y divide-border -my-1"
    >
      {meetings.map((m, i) => (
        <MeetingRow key={m.id} m={m} index={i} />
      ))}
    </WidgetCard>
  );
}
