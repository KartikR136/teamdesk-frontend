"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { listMeetings } from "@/lib/meetings";
import type { Meeting } from "@/types";

function groupByDay(meetings: Meeting[]): { label: string; meetings: Meeting[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const groups = new Map<string, Meeting[]>();
  for (const m of meetings) {
    const day = new Date(m.startsAt);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const day = new Date(key);
      let label: string;
      if (day.getTime() === today.getTime()) label = "Today";
      else if (day.getTime() === tomorrow.getTime()) label = "Tomorrow";
      else
        label = day.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      return { label, meetings: items };
    });
}

export default function MeetingsPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    setLoading(true);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);

    listMeetings(currentOrg.id, {
      from: from.toISOString(),
      to: to.toISOString(),
      limit: 100,
    })
      .then((res) => setMeetings(res.data))
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, [currentOrg]);

  const groups = useMemo(() => groupByDay(meetings), [meetings]);

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text tracking-tight">Meetings</h1>
              <p className="text-sm text-text-muted mt-0.5">
                Everything on the calendar for the next 30 days.
              </p>
            </div>
            <Link href="/dashboard/meetings/new">
              <Button size="sm" leftIcon={<Plus size={14} />}>
                Schedule meeting
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<CalendarClock size={30} />}
                title="Nothing scheduled"
                description="No meetings in the next 30 days. Schedule one to get your team on the same page."
                action={
                  <Link href="/dashboard/meetings/new">
                    <Button size="sm">Schedule your first meeting</Button>
                  </Link>
                }
              />
            </EmptyStateCard>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-2">
                    {group.label}
                  </h2>
                  <div className="space-y-2">
                    {group.meetings.map((m) => (
                      <MeetingCard key={m.id} meeting={m} myUserId={user?.id} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
