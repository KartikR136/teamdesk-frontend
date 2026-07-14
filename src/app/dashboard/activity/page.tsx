"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActivityList } from "@/components/activity/ActivityList";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ActivityEntry, PaginatedResponse } from "@/types";

// Filter chips: only "All" actually filters (i.e. does nothing) right now.
// Reserved architecture for Comments/Projects/Issues/Members filters —
// intentionally not implemented, since GET /activity has no query params
// beyond pagination (confirmed from the route file). Filtering by type
// would mean fetching everything and filtering client-side, honest only
// for already-loaded pages — not built until there's a real reason to.
type FilterChip = "All";
const FILTER_CHIPS: FilterChip[] = ["All"];

export default function ActivityPage() {
  const { currentOrg } = useOrg();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterChip>("All");

  useEffect(() => {
    if (!currentOrg) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<ActivityEntry>>(
          `/api/organizations/${currentOrg.id}/activity`,
        );
        setEntries(res.data);
        setNextCursor(res.nextCursor);
      } catch {
        setEntries([]);
        setNextCursor(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentOrg]);

  async function loadMore() {
    if (!currentOrg || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await apiFetch<PaginatedResponse<ActivityEntry>>(
        `/api/organizations/${currentOrg.id}/activity?cursor=${encodeURIComponent(nextCursor)}`,
      );
      setEntries((prev) => [...prev, ...res.data]);
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <h1 className="text-xl font-semibold tracking-tight text-text mb-1">Activity</h1>
          <p className="text-sm text-text-muted mb-5">
            {currentOrg?.name ?? "Your organization"}
          </p>

          <div className="flex gap-1 mb-5">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-fast",
                  activeFilter === chip
                    ? "bg-primary-subtle text-primary-subtle-text"
                    : "text-text-muted hover:bg-surface-hover",
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          <Card className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-3.5 flex-1" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                ))}
              </div>
            ) : (
              <ActivityList entries={entries} />
            )}

            {nextCursor && (
              <div className="mt-5 text-center border-t border-border pt-4">
                <Button variant="link" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
