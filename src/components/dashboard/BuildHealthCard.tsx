"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { apiFetch, isAbortError } from "@/lib/api";

// Matches BuildHealthDto in the backend's dashboard.dto.ts — now served
// by NativeBuildHealthProvider (backed by BuildPipeline/BuildRun) instead
// of the old always-empty MockBuildHealthProvider.
interface BuildHealth {
  pipelineStatus: "passing" | "failing" | "running";
  latestBuildNumber: number;
  coveragePercent: number;
  testsPassing: number;
  testsFailing: number;
  avgBuildDurationSeconds: number;
  lastUpdated: string;
}

// Shape returned by GET /api/dashboard/home — only the one field this
// widget actually reads, matching DeploymentsCard.tsx's convention.
interface DashboardHomeBuildHealthResponse {
  buildHealth: BuildHealth;
}

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

  const load = useCallback((signal?: AbortSignal) => {
    setStatus("loading");
    return apiFetch<DashboardHomeBuildHealthResponse>("/api/dashboard/home", {
      signal,
    })
      .then((data) => {
        setHealth(data.buildHealth);
        // latestBuildNumber === 0 is NativeBuildHealthProvider's signal
        // for "no pipeline has reported a build yet" (see
        // integrationRequired in the provider) — same "empty array"
        // convention DeploymentsCard uses, just expressed for a
        // single-object result.
        setStatus(data.buildHealth.latestBuildNumber === 0 ? "empty" : "ready");
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      void load(controller.signal);
    });
    return () => controller.abort();
  }, [load]);

  const pipeline = health ? PIPELINE_CONFIG[health.pipelineStatus] : null;

  return (
    <WidgetCard
      title="Build Health"
      icon={<Activity size={15} />}
      status={status}
      onRetry={() => void load()}
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
          title="No builds reported yet"
          description="Trigger a demo build or point a real CI job at your pipeline's webhook to see build health here."
          compact
          action={
            <Link
              href="/dashboard/build-health"
              className="text-xs font-medium text-primary hover:underline"
            >
              Set up a pipeline
            </Link>
          }
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

          <Link
            href="/dashboard/build-health"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View build history & pipelines
            <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </WidgetCard>
  );
}
