"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Rocket,
  Eye,
  FlaskConical,
  Code2,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { apiFetch, isAbortError } from "@/lib/api";

// Frontend's own dashboard-widget shape (lowercase environment/status
// literals) — matches DeploymentDto in the backend's dashboard.dto.ts,
// not the full native Deployment type in @/types (that one backs the
// /dashboard/deployments detail pages instead).
type DeployEnvironment = "production" | "preview" | "staging" | "development";

interface DashboardDeployment {
  id: string;
  environment: DeployEnvironment;
  status: "success" | "failed" | "in_progress";
  commitHash: string;
  commitMessage: string;
  durationSeconds: number;
  triggeredBy: string;
  deployedAt: string;
  url?: string;
}

// Shape returned by GET /api/dashboard/home — only the one field this
// widget actually reads, matching PullRequestsCard.tsx's convention.
interface DashboardHomeDeploymentsResponse {
  deployments: DashboardDeployment[];
}

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
  d: DashboardDeployment;
  index: number;
  isLast: boolean;
}) {
  const env = ENV_CONFIG[d.environment];
  const statusCfg = STATUS_CONFIG[d.status];
  const row = (
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

      <div className="flex-1 min-w-0 pb-1 group">
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-0.5">
          {env.icon}
          {env.label}
          <span className="text-text-subtle font-normal">
            · {hoursAgo(d.deployedAt)}
          </span>
        </div>
        <p className="text-sm text-text leading-snug truncate group-hover:text-primary transition-colors">
          {d.commitMessage}
        </p>
        <p className="text-xs text-text-subtle font-mono mt-0.5">
          {d.commitHash} · {d.durationSeconds}s · by {d.triggeredBy}
        </p>
      </div>
    </motion.div>
  );

  return d.url ? (
    <Link href={d.url} className="block">
      {row}
    </Link>
  ) : (
    row
  );
}

export function DeploymentsCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [deployments, setDeployments] = useState<DashboardDeployment[]>([]);

  const load = useCallback((signal?: AbortSignal) => {
    setStatus("loading");
    return apiFetch<DashboardHomeDeploymentsResponse>("/api/dashboard/home", {
      signal,
    })
      .then((data) => {
        setDeployments(data.deployments);
        setStatus(data.deployments.length === 0 ? "empty" : "ready");
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <WidgetCard
      title="Recent Deployments"
      icon={<Rocket size={15} />}
      status={status}
      onRetry={() => void load()}
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
          description="Ship your first deploy to see it show up here."
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
      {deployments.length > 0 && (
        <Link
          href="/dashboard/deployments"
          className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all deployments
          <ArrowRight size={12} />
        </Link>
      )}
    </WidgetCard>
  );
}
