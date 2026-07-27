"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Ban,
  Webhook,
  RefreshCw,
  Copy,
  PlayCircle,
  AlertTriangle,
  TrendingUp,
  GitBranch,
} from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { useNotify } from "@/lib/notifications";
import {
  listBuildPipelines,
  createBuildPipeline,
  rotateBuildPipelineWebhook,
  triggerBuildRun,
  listBuildRuns,
  getBuildHealth,
} from "@/lib/buildHealth";
import type {
  BuildPipeline,
  BuildRun,
  BuildRunStatus,
  BuildHealthAggregate,
  BuildProvider,
} from "@/types";

const PROVIDER_LABEL: Record<BuildProvider, string> = {
  GITHUB_ACTIONS: "GitHub Actions",
  CIRCLECI: "CircleCI",
  GITLAB_CI: "GitLab CI",
  BUILDKITE: "Buildkite",
  JENKINS: "Jenkins",
  NATIVE: "Simulated (no CI)",
};

const STATUS_CONFIG: Record<
  BuildRunStatus,
  { icon: React.ReactNode; color: string; label: string }
> = {
  QUEUED: { icon: <Loader2 size={13} />, color: "text-text-muted", label: "Queued" },
  RUNNING: {
    icon: <Loader2 size={13} className="animate-spin" />,
    color: "text-primary",
    label: "Running",
  },
  PASSING: { icon: <CheckCircle2 size={13} />, color: "text-success", label: "Passing" },
  FAILING: { icon: <XCircle size={13} />, color: "text-danger", label: "Failing" },
  CANCELLED: { icon: <Ban size={13} />, color: "text-text-subtle", label: "Cancelled" },
};

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function apiOrigin(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

/* ---------------------------- Create pipeline ---------------------------- */

function CreatePipelineDialog({ onCreated }: { onCreated: (p: BuildPipeline) => void }) {
  const { currentOrg } = useOrg();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<BuildProvider>("GITHUB_ACTIONS");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg || !name.trim()) return;
    setSubmitting(true);
    try {
      const pipeline = await createBuildPipeline(currentOrg.id, {
        name: name.trim(),
        provider,
        defaultBranch: defaultBranch.trim() || "main",
      });
      onCreated(pipeline);
      notify.success("Pipeline created", `Point ${PROVIDER_LABEL[provider]} at its webhook URL to start reporting real builds.`);
      setOpen(false);
      setName("");
    } catch {
      notify.error("Could not create pipeline", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" leftIcon={<Plus size={14} />}>
          New pipeline
        </Button>
      </DialogTrigger>
      <DialogContent>
        <h2 className="text-base font-semibold text-text mb-1">New build pipeline</h2>
        <p className="text-sm text-text-muted mb-4">
          Creates a webhook URL your real CI job can report to, or you can trigger
          simulated builds for demoing the feature.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Pipeline name
            </label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="api-tests"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as BuildProvider)}
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:border-primary"
            >
              {(Object.keys(PROVIDER_LABEL) as BuildProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Default branch
            </label>
            <Input
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              placeholder="main"
            />
          </div>
          <Button type="submit" className="w-full" loading={submitting}>
            Create pipeline
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ Pipeline card ----------------------------- */

function PipelineCard({
  pipeline,
  onChanged,
}: {
  pipeline: BuildPipeline;
  onChanged: (p: BuildPipeline) => void;
}) {
  const notify = useNotify();
  const [triggering, setTriggering] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(pipeline.webhookUrl ?? null);

  async function handleTrigger() {
    setTriggering(true);
    try {
      const run = await triggerBuildRun(pipeline.id, {
        commitHash: randomHex(7),
        commitMessage: "Simulated build for demo purposes",
        branch: pipeline.defaultBranch,
      });
      notify[run.status === "PASSING" ? "success" : "error"](
        run.status === "PASSING" ? "Build passed" : "Build failed",
        `Build #${run.buildNumber} on ${run.branch}`,
      );
      onChanged(pipeline);
    } catch {
      notify.error("Could not trigger build", "Please try again.");
    } finally {
      setTriggering(false);
    }
  }

  async function handleRotate() {
    setRotating(true);
    try {
      const res = await rotateBuildPipelineWebhook(pipeline.id);
      setWebhookUrl(res.webhookUrl);
      notify.success("Webhook rotated", "Update your CI config with the new URL below.");
    } catch {
      notify.error("Could not rotate webhook", "Please try again.");
    } finally {
      setRotating(false);
    }
  }

  function handleCopy() {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(`${apiOrigin()}${webhookUrl}`);
    notify.success("Copied", "Webhook URL copied to clipboard.");
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-medium text-text">{pipeline.name}</p>
          <p className="text-xs text-text-subtle">
            {PROVIDER_LABEL[pipeline.provider]} · branch {pipeline.defaultBranch} ·{" "}
            {pipeline._count.runs} run{pipeline._count.runs === 1 ? "" : "s"}
          </p>
        </div>
        {!pipeline.isActive && <Badge variant="neutral">Inactive</Badge>}
      </div>

      {webhookUrl ? (
        <div className="mb-3 rounded-md bg-surface-hover/60 px-3 py-2">
          <p className="text-[11px] text-text-subtle mb-1 flex items-center gap-1">
            <Webhook size={11} /> Webhook URL — point your real CI job here
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-text truncate flex-1">
              {apiOrigin()}
              {webhookUrl}
            </code>
            <button
              onClick={handleCopy}
              className="text-text-subtle hover:text-text shrink-0"
              title="Copy"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-[11px] text-text-subtle">
          Webhook URL is only shown once, right after creation or rotation — rotate to see it again.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<PlayCircle size={13} />}
          onClick={handleTrigger}
          loading={triggering}
        >
          Trigger demo build
        </Button>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<RefreshCw size={13} />}
          onClick={handleRotate}
          loading={rotating}
        >
          Rotate webhook
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- Run history ------------------------------ */

function RunRow({ run }: { run: BuildRun }) {
  const cfg = STATUS_CONFIG[run.status];
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.color)}>
            {cfg.icon}
            {cfg.label}
          </span>
          <span className="text-xs text-text-subtle">
            #{run.buildNumber} · {run.pipeline.name}
          </span>
        </div>
        <p className="text-sm text-text truncate">{run.commitMessage ?? "(no message)"}</p>
        <p className="text-xs text-text-subtle font-mono mt-0.5 flex items-center gap-1">
          <GitBranch size={11} />
          {run.branch} · {run.commitHash.slice(0, 7)}
          {run.durationSeconds ? ` · ${run.durationSeconds}s` : ""}
          {run.source !== "native" ? ` · via ${run.source}` : ""}
        </p>
        {run.flakyTestNames.length > 0 && (
          <p className="text-xs text-warning mt-1 flex items-center gap-1">
            <AlertTriangle size={11} /> {run.flakyTestNames.length} flaky test
            {run.flakyTestNames.length === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-text-muted">{timeAgo(run.createdAt)}</p>
        <p className="text-xs text-text-subtle">
          {run.testsPassing}/{run.testsPassing + run.testsFailing} tests
        </p>
      </div>
    </div>
  );
}

/* --------------------------------- Page ----------------------------------- */

export default function BuildHealthPage() {
  const { currentOrg } = useOrg();
  const [health, setHealth] = useState<BuildHealthAggregate | null>(null);
  const [pipelines, setPipelines] = useState<BuildPipeline[]>([]);
  const [runs, setRuns] = useState<BuildRun[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!currentOrg) return;
    setLoading(true);
    Promise.all([
      getBuildHealth(currentOrg.id, 14),
      listBuildPipelines(currentOrg.id),
      listBuildRuns(currentOrg.id, { limit: 20 }),
    ])
      .then(([healthRes, pipelinesRes, runsRes]) => {
        setHealth(healthRes);
        setPipelines(pipelinesRes);
        setRuns(runsRes.data);
      })
      .catch(() => {
        setHealth(null);
        setPipelines([]);
        setRuns([]);
      })
      .finally(() => setLoading(false));
  }, [currentOrg]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text tracking-tight flex items-center gap-2">
                <Activity size={20} /> Build Health
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                CI pipeline status, coverage trend, and flaky tests across your org's
                builds over the last 14 days.
              </p>
            </div>
            <CreatePipelineDialog onCreated={() => load()} />
          </div>

          {/* Summary strip */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : health && health.summary.totalRuns > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-lg border border-border px-3 py-3">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                  <TrendingUp size={13} /> Pass rate
                </div>
                <p className="text-lg font-semibold text-text tracking-tight">
                  {health.summary.passRatePercent?.toFixed(0) ?? "—"}%
                </p>
              </div>
              <div className="rounded-lg border border-border px-3 py-3">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                  <Activity size={13} /> Avg coverage
                </div>
                <p className="text-lg font-semibold text-text tracking-tight">
                  {health.summary.avgCoveragePercent?.toFixed(0) ?? "—"}%
                </p>
              </div>
              <div className="rounded-lg border border-border px-3 py-3">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                  <Loader2 size={13} /> Avg build time
                </div>
                <p className="text-lg font-semibold text-text tracking-tight">
                  {health.summary.avgDurationSeconds ?? "—"}s
                </p>
              </div>
              <div className="rounded-lg border border-border px-3 py-3">
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                  <AlertTriangle size={13} /> Flaky tests
                </div>
                <p className="text-lg font-semibold text-text tracking-tight">
                  {health.flakyTests.length}
                </p>
              </div>
            </div>
          ) : null}

          {/* Flaky tests roundup */}
          {health && health.flakyTests.length > 0 && (
            <div className="mb-6 rounded-lg border border-warning/30 bg-warning-subtle/30 px-4 py-3">
              <p className="text-xs font-medium text-warning mb-1.5 flex items-center gap-1">
                <AlertTriangle size={13} /> Currently flaky
              </p>
              <div className="flex flex-wrap gap-1.5">
                {health.flakyTests.map((t) => (
                  <Badge key={t.name} variant="warning">
                    {t.name} ({t.occurrences})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Pipelines */}
          <h2 className="text-sm font-semibold text-text mb-3">Pipelines</h2>
          {loading ? (
            <div className="space-y-3 mb-8">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : pipelines.length === 0 ? (
            <EmptyStateCard className="mb-8">
              <EmptyState
                icon={<Webhook size={30} />}
                title="No pipelines yet"
                description="Create a pipeline to get a webhook URL for your real CI job, or trigger simulated builds to try the feature out."
                action={<CreatePipelineDialog onCreated={() => load()} />}
              />
            </EmptyStateCard>
          ) : (
            <div className="space-y-3 mb-8">
              {pipelines.map((p) => (
                <PipelineCard key={p.id} pipeline={p} onChanged={() => load()} />
              ))}
            </div>
          )}

          {/* Run history */}
          <h2 className="text-sm font-semibold text-text mb-3">Recent builds</h2>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<Activity size={30} />}
                title="No builds reported yet"
                description="Trigger a demo build above, or send a real webhook from your CI job."
              />
            </EmptyStateCard>
          ) : (
            <div className="space-y-2">
              {runs.map((r) => (
                <RunRow key={r.id} run={r} />
              ))}
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
