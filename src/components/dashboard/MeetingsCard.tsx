"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Users2,
  Presentation,
  ClipboardList,
  Rows3,
  Sparkle,
  RotateCcw,
  UserRound,
  ShieldAlert,
  MoreHorizontal,
  Check,
  X as XIcon,
  HelpCircle,
  MapPin,
  Link2,
} from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { apiFetch, isAbortError } from "@/lib/api";
import { rsvpToMeeting } from "@/lib/meetings";
import { useNotify } from "@/lib/notifications";
import type { MeetingKind, MeetingRsvpStatus, MeetingSummary } from "@/types";

const KIND_ICON: Record<MeetingKind, React.ReactNode> = {
  STANDUP: <Users2 size={13} />,
  SPRINT_PLANNING: <ClipboardList size={13} />,
  DESIGN_REVIEW: <Presentation size={13} />,
  BACKEND_SYNC: <Rows3 size={13} />,
  DEMO: <Sparkle size={13} />,
  RETROSPECTIVE: <RotateCcw size={13} />,
  ONE_ON_ONE: <UserRound size={13} />,
  INCIDENT_REVIEW: <ShieldAlert size={13} />,
  OTHER: <MoreHorizontal size={13} />,
};

// Shape returned by GET /api/dashboard/home — only the one field this
// widget actually reads, matching the "don't over-type a whole response
// just to read one key" convention other widgets in this folder use.
interface DashboardHomeMeetingsResponse {
  meetings: MeetingSummary[];
}

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

function isPast(dateStr: string, durationMinutes: number): boolean {
  const endsAt = new Date(dateStr).getTime() + durationMinutes * 60000;
  return endsAt < Date.now();
}

function MeetingRow({
  m,
  index,
  onRsvp,
}: {
  m: MeetingSummary;
  index: number;
  onRsvp: (meetingId: string, status: MeetingRsvpStatus) => void;
}) {
  const soon = isSoon(m.startsAt);
  const past = isPast(m.startsAt, m.durationMinutes);
  const needsResponse = !past && m.myRsvpStatus === "INVITED" && !m.isOrganizer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      className="flex items-center gap-3 py-2"
    >
      <div className="flex flex-col items-center w-14 shrink-0 text-center">
        <span
          className={`text-sm font-semibold tabular-nums ${past ? "text-text-subtle" : "text-text"}`}
        >
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
        <Link
          href={`/dashboard/meetings/${m.id}`}
          className="text-sm font-medium text-text truncate hover:text-primary transition-colors block"
        >
          {m.title}
        </Link>
        <p className="text-xs text-text-subtle flex items-center gap-1.5 flex-wrap">
          <span>
            {m.durationMinutes}min · {m.attendeeCount} attendee
            {m.attendeeCount === 1 ? "" : "s"}
          </span>
          {m.projectName && (
            <span className="inline-flex items-center gap-1">
              · {m.projectName}
            </span>
          )}
          {!!m.linkedIssueCount && (
            <span className="inline-flex items-center gap-0.5 text-primary">
              <Link2 size={10} />
              {m.linkedIssueCount}
            </span>
          )}
          {m.location && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin size={10} />
              {m.location}
            </span>
          )}
        </p>
      </div>

      {needsResponse ? (
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip content="Accept">
            <button
              onClick={() => onRsvp(m.id, "ACCEPTED")}
              className="h-6 w-6 rounded-md flex items-center justify-center text-success hover:bg-success-subtle transition-colors"
            >
              <Check size={13} />
            </button>
          </Tooltip>
          <Tooltip content="Decline">
            <button
              onClick={() => onRsvp(m.id, "DECLINED")}
              className="h-6 w-6 rounded-md flex items-center justify-center text-danger hover:bg-danger-subtle transition-colors"
            >
              <XIcon size={13} />
            </button>
          </Tooltip>
        </div>
      ) : m.myRsvpStatus === "DECLINED" ? (
        <Badge variant="danger" className="shrink-0">
          Declined
        </Badge>
      ) : m.myRsvpStatus === "TENTATIVE" ? (
        <Badge variant="warning" className="shrink-0">
          <HelpCircle size={10} />
          Maybe
        </Badge>
      ) : null}
    </motion.div>
  );
}

export function MeetingsCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const notify = useNotify();

  const load = useCallback((signal?: AbortSignal) => {
    setStatus("loading");
    return apiFetch<DashboardHomeMeetingsResponse>("/api/dashboard/home", {
      signal,
    })
      .then((data) => {
        setMeetings(data.meetings);
        setStatus(data.meetings.length === 0 ? "empty" : "ready");
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function handleRsvp(meetingId: string, rsvpStatus: MeetingRsvpStatus) {
    const previous = meetings;
    // Optimistic update — same pattern as the decision detail page's
    // status control.
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId ? { ...m, myRsvpStatus: rsvpStatus } : m,
      ),
    );
    try {
      await rsvpToMeeting(meetingId, rsvpStatus);
      notify.success(
        rsvpStatus === "ACCEPTED" ? "You're in" : "RSVP updated",
      );
    } catch {
      setMeetings(previous);
      notify.error("Could not update RSVP", "Please try again.");
    }
  }

  return (
    <WidgetCard
      title="Today's Meetings"
      icon={<CalendarClock size={15} />}
      status={status}
      headerAction={
        <Link
          href="/dashboard/meetings"
          className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
        >
          View all
        </Link>
      }
      onRetry={() => void load()}
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
          description="Nothing on the calendar for today. Schedule one from the Meetings page."
          compact
          action={
            <Link
              href="/dashboard/meetings"
              className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Schedule a meeting
            </Link>
          }
        />
      }
      contentClassName="divide-y divide-border -my-1"
    >
      {meetings.map((m, i) => (
        <MeetingRow key={m.id} m={m} index={i} onRsvp={handleRsvp} />
      ))}
    </WidgetCard>
  );
}
