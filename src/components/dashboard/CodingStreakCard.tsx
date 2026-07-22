"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import {
  Flame,
  GitCommitHorizontal,
  Eye,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getMockDashboardData, type CodingStats } from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";

// Streak milestones worth a small celebratory highlight — 7/14/30/60/100
// day marks. Anything else just renders as a normal number.
const MILESTONES = [7, 14, 30, 60, 100];

function CountUp({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 60, damping: 15 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(value);
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return unsub;
  }, [value, spring, rounded]);

  return <>{display}</>;
}

function StatBlock({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-surface-hover/60 px-3 py-2.5">
      <span className="text-text-muted shrink-0">{icon}</span>
      <div>
        <p className="text-base font-semibold text-text tabular-nums leading-none">
          <CountUp value={value} />
        </p>
        <p className="text-[11px] text-text-subtle mt-1">{label}</p>
      </div>
    </div>
  );
}

export function CodingStreakCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [stats, setStats] = useState<CodingStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` and read `.codingStats`.
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted) return;
        setStats(getMockDashboardData().codingStats);
        setStatus("ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  const isMilestone = stats
    ? MILESTONES.includes(stats.currentStreakDays)
    : false;

  return (
    <WidgetCard
      title="Coding Streak"
      icon={<Flame size={15} />}
      status={status}
      onRetry={() => setStatus("loading")}
      skeleton={
        <div className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <div className="grid grid-cols-2 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      }
      emptyState={
        <EmptyState
          icon={<Flame size={26} />}
          title="No activity yet this week"
          description="Ship your first commit or close an issue to start your streak."
          compact
        />
      }
    >
      {stats && (
        <div className="space-y-4">
          {/* Streak headline */}
          <motion.div
            className="flex items-center gap-2.5"
            animate={isMilestone ? { scale: [1, 1.04, 1] } : undefined}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="flex items-center justify-center h-9 w-9 rounded-full bg-warning-subtle text-warning">
              <Flame size={18} />
            </span>
            <div>
              <p className="text-xl font-bold text-text tabular-nums leading-none">
                <CountUp value={stats.currentStreakDays} /> days
              </p>
              <p className="text-xs text-text-subtle mt-0.5">
                {isMilestone ? "🎉 Milestone reached!" : "Current streak"}
              </p>
            </div>
          </motion.div>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <StatBlock
              icon={<CheckCircle2 size={15} />}
              value={stats.issuesCompletedThisWeek}
              label="Issues closed"
            />
            <StatBlock
              icon={<Eye size={15} />}
              value={stats.reviewsCompletedThisWeek}
              label="Reviews done"
            />
            <StatBlock
              icon={<GitCommitHorizontal size={15} />}
              value={stats.commitsThisWeek}
              label="Commits"
            />
            <StatBlock
              icon={<Clock size={15} />}
              value={stats.focusHoursThisWeek}
              label="Focus hrs"
            />
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
