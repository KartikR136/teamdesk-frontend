"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Eye,
  FlaskConical,
  Code2,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  getMockDashboardData,
  type Deployment,
  type DeployEnvironment,
} from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";

const ENV_CONFIG: Record<
  DeployEnvironment,
  { icon: React.ReactNode; label: string }
> = {
  production: { icon: <Rocket size={13} />, label: "Production" },
  preview: { icon: <Eye size={13} />, label: "Preview" },
  staging: { icon: <FlaskConical size={13} />, label: "Staging" },
  development: { icon: <Code2 size={13} />, label: "Development" },
};

const STATUS_CONFIG: Record<
  Deployment["status"],
  { icon: React.ReactNode; color: string }
> = {
  success: { icon: <CheckCircle2 size={14} />, color: "text-success" },
  failed: { icon: <XCircle size={14} />, color: "text-danger" },
  in_progress: {
    icon: <Loader2 size={14} className="animate-spin" />,
    color: "text-primary",
  },
};

function hoursAgo(dateStr: string): string {
  const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function DeployRow({
  d,
  index,
  isLast,
}: {
  d: Deployment;
  index: number;
  isLast: boolean;
}) {
  const env = ENV_CONFIG[d.environment];
  const statusCfg = STATUS_CONFIG[d.status];
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      className="relative flex gap-3 pb-4 last:pb-0"
    >
      {/* Timeline rail */}
      <div className="flex flex-col items-center shrink-0">
        <span
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded-full bg-surface-hover",
            statusCfg.color,
          )}
        >
          {statusCfg.icon}
        </span>
        {!isLast && <span className="w-px flex-1 bg-border mt-1" />}
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-0.5">
          {env.icon}
          {env.label}
          <span className="text-text-subtle font-normal">
            · {hoursAgo(d.deployedAt)}
          </span>
        </div>
        <p className="text-sm text-text leading-snug truncate">
          {d.commitMessage}
        </p>
        <p className="text-xs text-text-subtle font-mono mt-0.5">
          {d.commitHash} · {d.durationSeconds}s · by {d.triggeredBy}
        </p>
      </div>
    </motion.div>
  );
}

export function DeploymentsCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` and read `.deployments` — likely backed by a CI/CD
        // provider webhook feed server-side.
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted) return;
        const data = getMockDashboardData().deployments;
        setDeployments(data);
        setStatus(data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <WidgetCard
      title="Recent Deployments"
      icon={<Rocket size={15} />}
      status={status}
      onRetry={() => setStatus("loading")}
      skeleton={
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-6 w-6 rounded-full" round />
              <div className="flex-1">
                <Skeleton className="h-3 w-24 mb-1.5" />
                <Skeleton className="h-4 w-4/5 mb-1.5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      }
      emptyState={
        <EmptyState
          icon={<Rocket size={26} />}
          title="No deployments yet"
          description="Once CI/CD is connected, every deploy will show up here."
          compact
        />
      }
    >
      {deployments.map((d, i) => (
        <DeployRow
          key={d.id}
          d={d}
          index={i}
          isLast={i === deployments.length - 1}
        />
      ))}
    </WidgetCard>
  );
}
