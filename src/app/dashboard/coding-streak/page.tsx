"use client";

import { useEffect, useState } from "react";
import {
  Flame,
  Trophy,
  Target,
  Clock,
  GitBranch,
  Snowflake,
} from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { apiFetch, isAbortError } from "@/lib/api";
import { StreakHeatmap } from "@/components/streak/StreakHeatmap";
import { AchievementBadges } from "@/components/streak/AchievementBadges";
import { StreakLeaderboard } from "@/components/streak/StreakLeaderboard";
import { GoalEditor } from "@/components/streak/GoalEditor";
import { FocusSessionLogger } from "@/components/streak/FocusSessionLogger";
import { WebhookSetupCard } from "@/components/streak/WebhookSetupCard";
import type { CodingStreakDetail } from "@/mock/dashboard";

export default function CodingStreakPage() {
  const { currentOrg } = useOrg();
  const [detail, setDetail] = useState<CodingStreakDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        const data = await apiFetch<CodingStreakDetail>(
          "/api/dashboard/coding-streak",
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setDetail(data);
        setStatus("ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text tracking-tight flex items-center gap-2">
              <Flame size={20} /> Coding Streak
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              Your daily activity streak, badges, goals, and how you stack up
              against your team.
            </p>
          </div>

          {status === "loading" && (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          )}

          {status === "error" && (
            <EmptyStateCard>
              <EmptyState
                icon={<Flame size={30} />}
                title="Couldn't load your streak"
                description="Something went wrong fetching your coding streak data."
              />
            </EmptyStateCard>
          )}

          {status === "ready" && detail && (
            <div className="space-y-4">
              {/* Headline */}
              <Card>
                <CardContent className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-12 w-12 rounded-full bg-warning-subtle text-warning">
                      <Flame size={22} />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-text tabular-nums leading-none">
                        {detail.currentStreakDays} days
                      </p>
                      <p className="text-xs text-text-subtle mt-1">
                        Current streak
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-12 w-12 rounded-full bg-info-subtle text-info">
                      <Trophy size={20} />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-text tabular-nums leading-none">
                        {detail.longestStreakDays} days
                      </p>
                      <p className="text-xs text-text-subtle mt-1">
                        Longest streak
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-subtle text-primary">
                      <Snowflake size={20} />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-text tabular-nums leading-none">
                        {detail.streakFreezesAvailable}
                      </p>
                      <p className="text-xs text-text-subtle mt-1">
                        Streak freezes available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle>Last 90 days</CardTitle>
                </CardHeader>
                <CardContent>
                  <StreakHeatmap cells={detail.heatmap} />
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-text-subtle">
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-surface-hover inline-block" />{" "}
                      No activity
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-success inline-block" />{" "}
                      Active
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-info/40 inline-block" />{" "}
                      Freeze-covered
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5">
                    <Trophy size={14} /> Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AchievementBadges achievements={detail.achievements} />
                </CardContent>
              </Card>

              {/* Weekly goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5">
                    <Target size={14} /> Weekly goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-surface-hover/60 px-3 py-2.5">
                      <p className="text-text-subtle text-xs mb-1">
                        Commits this week
                      </p>
                      <p className="font-semibold text-text tabular-nums">
                        {detail.commitsThisWeek} / {detail.weeklyCommitGoal}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-hover/60 px-3 py-2.5">
                      <p className="text-text-subtle text-xs mb-1">
                        Issues closed this week
                      </p>
                      <p className="font-semibold text-text tabular-nums">
                        {detail.issuesCompletedThisWeek} /{" "}
                        {detail.weeklyIssueGoal}
                      </p>
                    </div>
                  </div>
                  <GoalEditor
                    weeklyCommitGoal={detail.weeklyCommitGoal}
                    weeklyIssueGoal={detail.weeklyIssueGoal}
                    onSaved={(goals) =>
                      setDetail((d) => (d ? { ...d, ...goals } : d))
                    }
                  />
                </CardContent>
              </Card>

              {/* Focus sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5">
                    <Clock size={14} /> Focus time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-text">
                    <span className="font-semibold tabular-nums">
                      {detail.focusHoursThisWeek}
                    </span>{" "}
                    hours logged this week
                  </p>
                  <FocusSessionLogger
                    onLogged={(minutes) =>
                      setDetail((d) =>
                        d
                          ? {
                              ...d,
                              focusHoursThisWeek:
                                Math.round(
                                  (d.focusHoursThisWeek + minutes / 60) * 10,
                                ) / 10,
                            }
                          : d,
                      )
                    }
                  />
                </CardContent>
              </Card>

              {/* Webhook setup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5">
                    <GitBranch size={14} /> Connect your git activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WebhookSetupCard
                    webhookUrl={detail.webhookUrl}
                    snippet={detail.githubActionsSnippet}
                    onRotated={(url) =>
                      setDetail((d) => (d ? { ...d, webhookUrl: url } : d))
                    }
                  />
                </CardContent>
              </Card>

              {/* Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5">
                    <Trophy size={14} /> Team leaderboard
                    {currentOrg && (
                      <Badge variant="neutral">{currentOrg.name}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StreakLeaderboard organizationId={currentOrg?.id ?? null} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
