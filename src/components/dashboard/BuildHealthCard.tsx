"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { getMockDashboardData, type BuildHealth } from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";

const PIPELINE_CONFIG: Record<
  BuildHealth["pipelineStatus"],
  { icon: React.ReactNode; color: string; label: string }
> = {
  passing: {
    icon: <CheckCircle2 size={16} />,
    color: "text-success",
    label: "Passing",
  },
  failing: {
    icon: <XCircle size={16} />,
    color: "text-danger",
    label: "Failing",
  },
  running: {
    icon: <Loader2 size={16} className="animate-spin" />,
    color: "text-primary",
    label: "Running",
  },
};

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function BuildHealthCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [health, setHealth] = useState<BuildHealth | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` and read `.buildHealth`.
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted) return;
        setHealth(getMockDashboardData().buildHealth);
        setStatus("ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  const pipeline = health ? PIPELINE_CONFIG[health.pipelineStatus] : null;

  return (
    <WidgetCard
      title="Build Health"
      icon={<Activity size={15} />}
      status={status}
      onRetry={() => setStatus("loading")}
      skeleton={
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      }
      emptyState={
        <EmptyState
          icon={<Activity size={26} />}
          title="No CI/CD data yet"
          description="Connect a pipeline provider to see build health here."
          compact
        />
      }
    >
      {health && pipeline && (
        <div className="space-y-4">
          {/* Pipeline status + build number */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "flex items-center gap-1.5 text-sm font-semibold",
                pipeline.color,
              )}
            >
              {pipeline.icon}
              {pipeline.label}
            </span>
            <span className="text-xs text-text-subtle">
              Build #{health.latestBuildNumber} · {timeAgo(health.lastUpdated)}
            </span>
          </div>

          {/* Coverage bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>Coverage</span>
              <span className="font-medium text-text">
                {health.coveragePercent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  health.coveragePercent >= 80 ? "bg-success" : "bg-warning",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${health.coveragePercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Test / duration stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-surface-hover/60 py-2.5">
              <p className="text-base font-semibold text-success tabular-nums">
                {health.testsPassing}
              </p>
              <p className="text-[11px] text-text-subtle">Passing</p>
            </div>
            <div className="rounded-lg bg-surface-hover/60 py-2.5">
              <p
                className={cn(
                  "text-base font-semibold tabular-nums",
                  health.testsFailing > 0 ? "text-danger" : "text-text-subtle",
                )}
              >
                {health.testsFailing}
              </p>
              <p className="text-[11px] text-text-subtle">Failing</p>
            </div>
            <div className="rounded-lg bg-surface-hover/60 py-2.5">
              <p className="text-base font-semibold text-text tabular-nums">
                {health.avgBuildDurationSeconds}s
              </p>
              <p className="text-[11px] text-text-subtle">Avg build</p>
            </div>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
