import { apiFetch } from "./api";
import type {
  BuildPipeline,
  BuildProvider,
  BuildRun,
  BuildRunStatus,
  BuildHealthAggregate,
} from "@/types";

// Thin, typed wrappers around the build-health endpoints — mirrors the
// pattern lib/deployments.ts and lib/pullRequests.ts use: no separate
// "service" abstraction, just typed apiFetch calls colocated by resource.

export interface CreatePipelineInput {
  name: string;
  provider?: BuildProvider;
  defaultBranch?: string;
  projectId?: string | null;
}

export function createBuildPipeline(
  organizationId: string,
  input: CreatePipelineInput,
) {
  return apiFetch<BuildPipeline>(
    `/api/organizations/${organizationId}/build-pipelines`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function listBuildPipelines(organizationId: string, signal?: AbortSignal) {
  return apiFetch<BuildPipeline[]>(
    `/api/organizations/${organizationId}/build-pipelines`,
    { signal },
  );
}

export function updateBuildPipeline(
  pipelineId: string,
  input: { name?: string; isActive?: boolean; defaultBranch?: string },
) {
  return apiFetch<BuildPipeline>(`/api/build-pipelines/${pipelineId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function rotateBuildPipelineWebhook(pipelineId: string) {
  return apiFetch<{ webhookUrl: string }>(
    `/api/build-pipelines/${pipelineId}/rotate-webhook`,
    { method: "POST" },
  );
}

export interface TriggerBuildInput {
  branch?: string;
  commitHash: string;
  commitMessage: string;
  pullRequestId?: string | null;
}

/** Manually kicks off a deterministic, simulated build run — useful for
 * demoing the feature without wiring up a real CI job. A real integration
 * instead has its CI config POST to the pipeline's webhookUrl directly. */
export function triggerBuildRun(pipelineId: string, input: TriggerBuildInput) {
  return apiFetch<BuildRun>(`/api/build-pipelines/${pipelineId}/runs`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listBuildRuns(
  organizationId: string,
  params: {
    pipelineId?: string;
    status?: BuildRunStatus;
    branch?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
  } = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (params.pipelineId) query.set("pipelineId", params.pipelineId);
  if (params.status) query.set("status", params.status);
  if (params.branch) query.set("branch", params.branch);
  if (params.projectId) query.set("projectId", params.projectId);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return apiFetch<{
    data: BuildRun[];
    hasNextPage: boolean;
    nextCursor: string | null;
  }>(
    `/api/organizations/${organizationId}/build-runs${qs ? `?${qs}` : ""}`,
    { signal },
  );
}

export function getBuildRun(buildRunId: string, signal?: AbortSignal) {
  return apiFetch<BuildRun>(`/api/build-runs/${buildRunId}`, { signal });
}

export function getBuildHealth(
  organizationId: string,
  days = 14,
  signal?: AbortSignal,
) {
  return apiFetch<BuildHealthAggregate>(
    `/api/organizations/${organizationId}/build-health?days=${days}`,
    { signal },
  );
}
