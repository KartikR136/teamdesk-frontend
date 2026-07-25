"use client";

import Link from "next/link";
import {
  Users2,
  ClipboardList,
  Presentation,
  Rows3,
  Sparkle,
  RotateCcw,
  UserRound,
  ShieldAlert,
  MoreHorizontal,
  MapPin,
  Link2,
  Repeat,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Meeting, MeetingKind } from "@/types";

const KIND_ICON: Record<MeetingKind, React.ReactNode> = {
  STANDUP: <Users2 size={14} />,
  SPRINT_PLANNING: <ClipboardList size={14} />,
  DESIGN_REVIEW: <Presentation size={14} />,
  BACKEND_SYNC: <Rows3 size={14} />,
  DEMO: <Sparkle size={14} />,
  RETROSPECTIVE: <RotateCcw size={14} />,
  ONE_ON_ONE: <UserRound size={14} />,
  INCIDENT_REVIEW: <ShieldAlert size={14} />,
  OTHER: <MoreHorizontal size={14} />,
};

const RSVP_BADGE: Record<
  string,
  { label: string; variant: "success" | "danger" | "warning" | "neutral" }
> = {
  ACCEPTED: { label: "Going", variant: "success" },
  DECLINED: { label: "Declined", variant: "danger" },
  TENTATIVE: { label: "Maybe", variant: "warning" },
  INVITED: { label: "Awaiting response", variant: "neutral" },
};

export function MeetingCard({ meeting, myUserId }: { meeting: Meeting; myUserId?: string }) {
  const starts = new Date(meeting.startsAt);
  const myAttendance = meeting.attendees.find((a) => a.user.id === myUserId);
  const rsvp = myAttendance
    ? RSVP_BADGE[myAttendance.status]
    : meeting.createdById === myUserId
      ? RSVP_BADGE.ACCEPTED
      : null;

  return (
    <Link href={`/dashboard/meetings/${meeting.id}`}>
      <Card className="p-4 hover:border-border-hover transition-colors cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center w-16 shrink-0 text-center">
            <span className="text-sm font-semibold text-text tabular-nums">
              {starts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
            <span className="text-[11px] text-text-subtle">
              {starts.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>

          <span className="h-7 w-7 rounded-md bg-primary-subtle text-primary flex items-center justify-center shrink-0 mt-0.5">
            {KIND_ICON[meeting.kind]}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">{meeting.title}</p>
            <p className="text-xs text-text-subtle mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                {meeting.durationMinutes}min · {meeting.attendees.length} attendee
                {meeting.attendees.length === 1 ? "" : "s"}
              </span>
              {meeting.project && <span>· {meeting.project.name}</span>}
              {meeting.recurrenceRule !== "NONE" && (
                <span className="inline-flex items-center gap-0.5">
                  <Repeat size={10} />
                  {meeting.recurrenceRule.toLowerCase()}
                </span>
              )}
              {meeting.linkedIssues.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-primary">
                  <Link2 size={10} />
                  {meeting.linkedIssues.length} issue
                  {meeting.linkedIssues.length === 1 ? "" : "s"}
                </span>
              )}
              {meeting.location && (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin size={10} />
                  {meeting.location}
                </span>
              )}
            </p>
          </div>

          {rsvp && (
            <Badge variant={rsvp.variant} className="shrink-0">
              {rsvp.label}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
