"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { apiFetch, isAbortError } from "@/lib/api";
import type { LeaderboardEntry } from "@/mock/dashboard";

export function StreakLeaderboard({ organizationId }: { organizationId: string | null }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!organizationId) return;
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        const data = await apiFetch<{ entries: LeaderboardEntry[] }>(
          `/api/dashboard/coding-streak/leaderboard?organizationId=${organizationId}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setEntries(data.entries);
        setStatus("ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, [organizationId]);

  if (!organizationId) {
    return (
      <EmptyState
        icon={<Trophy size={24} />}
        title="No organization selected"
        description="Switch into an organization to see how your streak compares to your teammates."
        compact
      />
    );
  }

  if (status === "loading") {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (status === "error" || !entries) {
    return (
      <EmptyState
        icon={<Trophy size={24} />}
        title="Couldn't load leaderboard"
        description="Something went wrong fetching the team leaderboard."
        compact
      />
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={24} />}
        title="No teammates yet"
        description="Invite members to your organization to start a friendly streak rivalry."
        compact
      />
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((e, idx) => (
        <div
          key={e.userId}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5",
            e.isSelf ? "bg-primary-subtle" : "bg-surface-hover/60",
          )}
        >
          <span className="w-5 text-center text-xs font-semibold text-text-subtle tabular-nums">
            {idx + 1}
          </span>
          <Avatar name={e.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">
              {e.name}
              {e.isSelf && <span className="text-text-subtle font-normal"> (you)</span>}
            </p>
            <p className="text-[11px] text-text-subtle">
              Longest: {e.longestStreakDays} days
            </p>
          </div>
          <div className="flex items-center gap-1 text-warning shrink-0">
            <Flame size={14} />
            <span className="text-sm font-bold tabular-nums">{e.currentStreakDays}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
