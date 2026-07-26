"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Rocket,
  FolderKanban,
  GitBranch,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  HeartPulse,
  Clock,
} from "lucide-react";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { isAbortError } from "@/lib/api";
import {
  getDeployment,
  reportDeploymentHealth,
  rollbackDeployment,
  listDeployments,
} from "@/lib/deployments";
import { useNotify } from "@/lib/notifications";
import type { Deployment, DeployStatus } from "@/types";

const STATUS_CONFIG: Record<
  DeployStatus,
  { icon: React.ReactNode; variant: "neutral" | "success" | "danger" | "warning" | "info"; label: string }
> = {
  QUEUED: { icon: <Clock size={13} />, variant: "neutral", label: "Queued" },
  IN_PROGRESS: {
    icon: <Loader2 size={13} className="animate-spin" />,
    variant: "info",
    label: "In progress",
  },
  SUCCESS: { icon: <CheckCircle2 size={13} />, variant: "success", label: "Success" },
  FAILED: { icon: <XCircle size={13} />, variant: "danger", label: "Failed" },
  ROLLED_BACK: { icon: <RotateCcw size={13} />, variant: "warning", label: "Rolled back" },
};

const HEALTH_BADGE: Record<
  Deployment["health"],
  { variant: "neutral" | "success" | "warning" | "danger"; label: string }
> = {
  UNKNOWN: { variant: "neutral", label: "Not checked" },
  HEALTHY: { variant: "success", label: "Healthy" },
  DEGRADED: { variant: "warning", label: "Degraded" },
  UNHEALTHY: { variant: "danger", label: "Unhealthy" },
};

export default function DeploymentDetailPage() {
  const params = useParams<{ deploymentId: string }>();
  const notify = useNotify();

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackTargets, setRollbackTargets] = useState<Deployment[]>([]);
  const [showRollbackPicker, setShowRollbackPicker] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const data = await getDeployment(params.deploymentId, controller.signal);
        setDeployment(data);
      } catch (err) {
        if (!isAbortError(err)) notify.error("Could not load deployment");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.deploymentId]);

  async function handleHealthCheck() {
    if (!deployment) return;
    setCheckingHealth(true);
    try {
      // Deterministic-ish simulated ping — real integration would call
      // this same endpoint from a monitoring webhook instead.
      const roll = Math.random();
      const health = roll > 0.85 ? "UNHEALTHY" : roll > 0.65 ? "DEGRADED" : "HEALTHY";
      const updated = await reportDeploymentHealth(deployment.id, health);
      setDeployment(updated);
      notify[health === "HEALTHY" ? "success" : "error"](
        `Deployment is ${health.toLowerCase()}`,
      );
    } catch {
      notify.error("Health check failed");
    } finally {
      setCheckingHealth(false);
    }
  }

  async function openRollbackPicker() {
    if (!deployment) return;
    setShowRollbackPicker(true);
    try {
      const res = await listDeployments(deployment.organizationId, {
        environment: deployment.environment,
        status: "SUCCESS",
        limit: 10,
      });
      setRollbackTargets(res.data.filter((d) => d.id !== deployment.id));
    } catch {
      setRollbackTargets([]);
    }
  }

  async function handleRollback(targetId: string) {
    if (!deployment) return;
    setRollingBack(true);
    try {
      const restored = await rollbackDeployment(deployment.id, targetId);
      notify.success(
        "Rolled back",
        `Restored to ${restored.commitHash.slice(0, 7)}`,
      );
      setShowRollbackPicker(false);
      const refreshed = await getDeployment(deployment.id);
      setDeployment(refreshed);
    } catch {
      notify.error(
        "Rollback failed",
        "You may need manager permissions to roll back a deployment.",
      );
    } finally {
      setRollingBack(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardShell>
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  if (!deployment) {
    return (
      <ProtectedRoute>
        <DashboardShell>
          <div className="max-w-2xl mx-auto px-6 py-8">
            <p className="text-sm text-text-muted">Deployment not found.</p>
          </div>
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  const statusCfg = STATUS_CONFIG[deployment.status];
  const healthCfg = HEALTH_BADGE[deployment.health];
  const canRollback = deployment.status === "SUCCESS";

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Link
            href="/dashboard/deployments"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-4"
          >
            <ArrowLeft size={14} />
            All deployments
          </Link>

          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-xl font-semibold text-text tracking-tight leading-snug">
              {deployment.commitMessage}
            </h1>
            <Badge variant={statusCfg.variant} className="shrink-0">
              {statusCfg.icon}
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-sm text-text-subtle font-mono mb-6">
            {deployment.commitHash.slice(0, 7)} on {deployment.branch} ·{" "}
            {deployment.environment.toLowerCase()}
          </p>

          <Card className="p-4 mb-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Rocket size={14} />
              Triggered by {deployment.triggeredBy.name}
              {deployment.durationSeconds ? ` · ${deployment.durationSeconds}s` : ""}
            </div>
            {deployment.project && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <FolderKanban size={14} />
                {deployment.project.name}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <GitBranch size={14} />
              {deployment.branch}
            </div>
            {deployment.pullRequest && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <GitPullRequest size={14} />
                Ships{" "}
                <Link
                  href={`/dashboard/pull-requests/${deployment.pullRequest.id}`}
                  className="text-primary hover:underline"
                >
                  {deployment.pullRequest.title}
                </Link>
              </div>
            )}
            {deployment.previousDeployment && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <RotateCcw size={14} />
                Rolled back to{" "}
                <Link
                  href={`/dashboard/deployments/${deployment.previousDeployment.id}`}
                  className="text-primary hover:underline font-mono"
                >
                  {deployment.previousDeployment.commitHash.slice(0, 7)}
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-text">
                <HeartPulse size={14} />
                Post-deploy health
              </div>
              <Badge variant={healthCfg.variant}>{healthCfg.label}</Badge>
            </div>
            <p className="text-xs text-text-subtle mb-3">
              Simulates a monitoring ping against this deploy — wire a real
              uptime/APM webhook to this same endpoint to make it live.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleHealthCheck}
              disabled={checkingHealth || deployment.status !== "SUCCESS"}
            >
              {checkingHealth ? "Checking…" : "Run health check"}
            </Button>
          </Card>

          {canRollback && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text mb-2">
                <RotateCcw size={14} />
                Rollback
              </div>
              <p className="text-xs text-text-subtle mb-3">
                Restore {deployment.environment.toLowerCase()} to a previous,
                known-good deploy. Creates a new deployment entry and marks
                this one rolled back — manager role required.
              </p>
              {!showRollbackPicker ? (
                <Button size="sm" variant="secondary" onClick={openRollbackPicker}>
                  Choose a deployment to roll back to
                </Button>
              ) : rollbackTargets.length === 0 ? (
                <p className="text-sm text-text-subtle">
                  No other successful deployments in this environment yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {rollbackTargets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleRollback(t.id)}
                      disabled={rollingBack}
                      className="w-full text-left rounded-md border border-border px-3 py-2 hover:border-border-hover disabled:opacity-50"
                    >
                      <p className="text-sm text-text truncate">{t.commitMessage}</p>
                      <p className="text-xs text-text-subtle font-mono">
                        {t.commitHash.slice(0, 7)} ·{" "}
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {deployment.rollbacks.length > 0 && (
            <Card className="p-4 mt-4">
              <div className="text-sm font-medium text-text mb-2">
                Restored by later deploys
              </div>
              <div className="space-y-1.5">
                {deployment.rollbacks.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/deployments/${r.id}`}
                    className="block text-sm text-primary hover:underline font-mono"
                  >
                    {r.commitHash.slice(0, 7)} —{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
