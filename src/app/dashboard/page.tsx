"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/providers/OrgProvider";
import { useAuth } from "@/providers/AuthProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { QuickStats, type StatValue } from "@/components/dashboard/QuickStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProjectsSection } from "@/components/dashboard/ProjectsSection";
import { WorkspaceOverview } from "@/components/dashboard/WorkspaceOverview";
import { apiFetch } from "@/lib/api";
import type { ActivityEntry, Invitation, Member, PaginatedResponse } from "@/types";

export default function DashboardPage() {
  const { currentOrg, loading: orgLoading } = useOrg();
  const { user } = useAuth();

  const [projectStat, setProjectStat] = useState<StatValue | null>(null);
  const [memberStat, setMemberStat] = useState<StatValue | null>(null);
  const [activityTodayStat, setActivityTodayStat] = useState<StatValue | null>(null);
  const [inviteStat, setInviteStat] = useState<StatValue | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const isAdmin = currentOrg?.role === "ADMIN";

  // Lightweight first-page fetches purely for stat counts. Note: this
  // duplicates network calls already made by ActivityFeed/WorkspaceOverview
  // below (both fetch their own copy of members/activity for display).
  // Acceptable for this milestone — each component stays independently
  // simple and testable — but worth revisiting if a shared data layer
  // gets built later (e.g. SWR/React Query cache) so the same first page
  // isn't fetched three times on one screen load.
  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;

    async function loadStats() {
      setStatsLoading(true);

      const requests: Promise<void>[] = [
        apiFetch<PaginatedResponse<Member>>(
          `/api/organizations/${currentOrg!.id}/members`,
        )
          .then((res) => {
            if (!cancelled)
              setMemberStat({ label: "Members", count: res.data.length, hasMore: res.hasNextPage });
          })
          .catch(() => {
            // Degrade this one card rather than failing the whole page —
            // e.g. a role that can view the dashboard but not list members.
            if (!cancelled) setMemberStat({ label: "Members", count: 0, hasMore: false });
          }),
        apiFetch<PaginatedResponse<ActivityEntry>>(
          `/api/organizations/${currentOrg!.id}/activity`,
        )
          .then((res) => {
            if (cancelled) return;
            const today = new Date();
            const todayCount = res.data.filter((e) => {
              const d = new Date(e.createdAt);
              return (
                d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate()
              );
            }).length;
            setActivityTodayStat({
              label: "Activity today",
              count: todayCount,
              // We only ever see the first page here, so if that whole page
              // is today's activity, there may be more today-events beyond
              // it — flag as a floor in that edge case too.
              hasMore: res.hasNextPage && todayCount === res.data.length,
            });
          })
          .catch(() => {
            if (!cancelled) setActivityTodayStat({ label: "Activity today", count: 0, hasMore: false });
          }),
      ];

      if (isAdmin) {
        requests.push(
          apiFetch<PaginatedResponse<Invitation>>(
            `/api/organizations/${currentOrg!.id}/invitations`,
          )
            .then((res) => {
              if (!cancelled)
                setInviteStat({
                  label: "Pending invites",
                  count: res.data.length,
                  hasMore: res.hasNextPage,
                });
            })
            .catch(() => {
              if (!cancelled) setInviteStat({ label: "Pending invites", count: 0, hasMore: false });
            }),
        );
      }

      await Promise.all(requests);
      if (!cancelled) setStatsLoading(false);
    }

    void loadStats();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id, isAdmin]);

  const stats: StatValue[] = [
    projectStat ?? { label: "Projects", count: 0, hasMore: false },
    memberStat ?? { label: "Members", count: 0, hasMore: false },
    activityTodayStat ?? { label: "Activity today", count: 0, hasMore: false },
    ...(isAdmin ? [inviteStat ?? { label: "Pending invites", count: 0, hasMore: false }] : []),
  ];

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-5xl mx-auto px-6 py-10">
          {orgLoading && (
            <p className="text-sm text-text-subtle">Loading organizations…</p>
          )}

          {!orgLoading && !currentOrg && (
            <div className="rounded-xl border border-dashed border-border bg-surface px-8 py-16 text-center">
              <p className="text-text-muted">
                You don&apos;t belong to any organization yet.
              </p>
              <p className="text-sm text-text-subtle mt-1">
                Create one from the switcher above to get started.
              </p>
            </div>
          )}

          {currentOrg && (
            <>
              <DashboardGreeting name={user?.name} orgName={currentOrg.name} />

              <div className="mb-8">
                <QuickStats stats={stats} loading={statsLoading} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <ActivityFeed organizationId={currentOrg.id} />
                  <ProjectsSection
                    org={currentOrg}
                    onCountChange={(count, hasMore) =>
                      setProjectStat({ label: "Projects", count, hasMore })
                    }
                  />
                </div>

                {isAdmin && (
                  <div>
                    <WorkspaceOverview organizationId={currentOrg.id} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
