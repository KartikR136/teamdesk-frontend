"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { MeetingAttendee } from "@/types";

const STATUS_META: Record<
  string,
  { label: string; variant: "success" | "danger" | "warning" | "neutral" }
> = {
  ACCEPTED: { label: "Going", variant: "success" },
  DECLINED: { label: "Declined", variant: "danger" },
  TENTATIVE: { label: "Maybe", variant: "warning" },
  INVITED: { label: "Pending", variant: "neutral" },
};

export function AttendeeList({
  attendees,
  organizerId,
}: {
  attendees: MeetingAttendee[];
  organizerId: string;
}) {
  return (
    <ul className="space-y-2">
      {attendees.map((a) => {
        const meta = STATUS_META[a.status];
        return (
          <li key={a.id} className="flex items-center gap-2.5">
            <Avatar name={a.user.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text truncate">
                {a.user.name}
                {a.user.id === organizerId && (
                  <span className="text-text-subtle text-xs ml-1.5">Organizer</span>
                )}
              </p>
            </div>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
