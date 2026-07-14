"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActivityList } from "@/components/activity/ActivityList";
import type { ActivityEntry, PaginatedResponse } from "@/types";

export function ActivityFeed({ organizationId }: { organizationId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await apiFetch<PaginatedResponse<ActivityEntry>>(
          `/api/organizations/${organizationId}/activity`,
        );
        if (!cancelled) setEntries(res.data.slice(0, 5));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text">Recent activity</h2>
        <Link
          href="/dashboard/activity"
          className="text-xs text-primary hover:text-primary-hover transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="p-4">
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3.5 flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-text-subtle">Could not load recent activity.</p>
        )}

        {!loading && !error && <ActivityList entries={entries} compact />}
      </div>
    </Card>
  );
}
