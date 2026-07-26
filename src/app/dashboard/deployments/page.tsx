"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Gauge,
  Timer,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { listDeployments, getDoraMetrics } from "@/lib/deployments";
import type { Deployment, DeployEnvironment, DeployStatus, DoraMetrics } from "@/types";

const ENV_TABS: { value: DeployEnvironment; label: string }[] = [
  { value: "PRODUCTION", label: "Production" },
  { value: "STAGING", label: "Staging" },
  { value: "PREVIEW", label: "Preview" },
  { value: "DEVELOPMENT", label: "Development" },
];

const STATUS_CONFIG: Record<
  DeployStatus,
  { icon: React.ReactNode; color: string; label: string }
> = {
  QUEUED: { icon: <Timer size={13} />, color: "text-text-muted", label: "Queued" },
  IN_PROGRESS: {
    icon: <Loader2 size={13} className="animate-spin" />,
    color: "text-primary",
    label: "In progress",
  },
  SUCCESS: { icon: <CheckCircle2 size={13} />, color: "text-success", label: "Success" },
  FAILED: { icon: <XCircle size={13} />, color: "text-danger", label: "Failed" },
  ROLLED_BACK: {
    icon: <RotateCcw size={13} />,
    color: "text-warning",
    label: "Rolled back",
  },
};

const TIER_COLOR: Record<string, string> = {
  Elite: "text-success",
  High: "text-info",
  Medium: "text-warning",
  Low: "text-danger",
  Unknown: "text-text-subtle",
};

function DeployListRow({ d }: { d: Deployment }) {
  const statusCfg = STATUS_CONFIG[d.status];
  return (
    <Link
      href={`/dashboard/deployments/${d.id}`}
      className="block rounded-lg border border-border px-4 py-3 hover:border-border-hover hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-sm font-medium text-text leading-snug truncate">
          {d.commitMessage}
        </p>
        <span className={cn("flex items-center gap-1 text-xs font-medium shrink-0", statusCfg.color)}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>
      <p className="text-xs text-text-subtle font-mono truncate mb-2">
        {d.commitHash.slice(0, 7)} · {d.branch}
        {d.project ? ` · ${d.project.name}` : ""}
      </p>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          by {d.triggeredBy.name}
          {d.durationSeconds ? ` · ${d.durationSeconds}s` : ""}
        </span>
        {d.health !== "UNKNOWN" && (
          <Badge
            variant={
              d.health === "HEALTHY"
                ? "success"
                : d.health === "DEGRADED"
                  ? "warning"
                  : "danger"
            }
          >
            {d.health.toLowerCase()}
          </Badge>
        )}
      </div>
    </Link>
  );
}

function DoraStrip({ metrics }: { metrics: DoraMetrics | null }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const items = [
    {
      icon: <Rocket size={14} />,
      label: "Deploy frequency",
      value:
        metrics.deploymentFrequency.perDay >= 1
          ? `${metrics.deploymentFrequency.perDay.toFixed(1)}/day`
          : `${(metrics.deploymentFrequency.perDay * 7).toFixed(1)}/wk`,
      tier: metrics.deploymentFrequency.tier,
    },
    {
      icon: <Gauge size={14} />,
      label: "Lead time for changes",
      value:
        metrics.leadTimeForChanges.hours === null
          ? "No data"
          : metrics.leadTimeForChanges.hours < 24
            ? `${metrics.leadTimeForChanges.hours.toFixed(1)}h`
            : `${(metrics.leadTimeForChanges.hours / 24).toFixed(1)}d`,
      tier: metrics.leadTimeForChanges.tier,
    },
    {
      icon: <Activity size={14} />,
      label: "Change failure rate",
      value: `${metrics.changeFailureRate.percent.toFixed(1)}%`,
      tier: metrics.changeFailureRate.tier,
    },
    {
      icon: <TrendingUp size={14} />,
      label: "Time to restore",
      value:
        metrics.mttr.hours === null
          ? "No data"
          : metrics.mttr.hours < 24
            ? `${metrics.mttr.hours.toFixed(1)}h`
            : `${(metrics.mttr.hours / 24).toFixed(1)}d`,
      tier: metrics.mttr.tier,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border px-3 py-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
            {item.icon}
            {item.label}
          </div>
          <p className="text-lg font-semibold text-text tracking-tight">{item.value}</p>
          <p className={cn("text-xs font-medium", TIER_COLOR[item.tier])}>{item.tier} tier</p>
        </div>
      ))}
    </div>
  );
}

export default function DeploymentsPage() {
  const { currentOrg } = useOrg();
  const [env, setEnv] = useState<DeployEnvironment>("PRODUCTION");
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [metrics, setMetrics] = useState<DoraMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    setLoading(true);
    setMetrics(null);
    Promise.all([
      listDeployments(currentOrg.id, { environment: env, limit: 50 }),
      getDoraMetrics(currentOrg.id, { environment: env, days: 30 }),
    ])
      .then(([deploymentsRes, doraRes]) => {
        setDeployments(deploymentsRes.data);
        setMetrics(doraRes);
      })
      .catch(() => {
        setDeployments([]);
        setMetrics(null);
      })
      .finally(() => setLoading(false));
  }, [currentOrg, env]);

  const failedCount = useMemo(
    () => deployments.filter((d) => d.status === "FAILED").length,
    [deployments],
  );

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text tracking-tight">
                Deployments
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                Every deploy, its health, and how your team's DORA metrics look
                over the last 30 days.
              </p>
            </div>
            <Link href="/dashboard/deployments/new">
              <Button size="sm" leftIcon={<Plus size={14} />}>
                New deployment
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-1 mb-5 border-b border-border">
            {ENV_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setEnv(t.value)}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  env === t.value
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text",
                )}
              >
                {t.label}
                {t.value === "PRODUCTION" && failedCount > 0 && env === "PRODUCTION"
                  ? ` (${failedCount} failed)`
                  : ""}
              </button>
            ))}
          </div>

          <DoraStrip metrics={metrics} />

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : deployments.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<Rocket size={30} />}
                title="No deployments yet"
                description="Ship your first deploy to this environment to start tracking it here."
                action={
                  <Link href="/dashboard/deployments/new">
                    <Button size="sm">Deploy now</Button>
                  </Link>
                }
              />
            </EmptyStateCard>
          ) : (
            <div className="space-y-2">
              {deployments.map((d) => (
                <DeployListRow key={d.id} d={d} />
              ))}
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
