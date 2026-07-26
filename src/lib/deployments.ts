import { apiFetch } from "./api";
import type {
  Deployment,
  DeployEnvironment,
  DeployStatus,
  DeployHealth,
  DoraMetrics,
} from "@/types";

// Thin, typed wrappers around the deployments endpoints — mirrors the
// pattern lib/pullRequests.ts uses: no separate "service" abstraction,
// just typed apiFetch calls colocated by resource.

export interface CreateDeploymentInput {
  environment?: DeployEnvironment;
  commitHash: string;
  commitMessage: string;
  branch?: string;
  projectId?: string | null;
  pullRequestId?: string | null;
  notes?: string;
}

export function createDeployment(
  organizationId: string,
  input: CreateDeploymentInput,
) {
  return apiFetch<Deployment>(
    `/api/organizations/${organizationId}/deployments`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function listDeployments(
  organizationId: string,
  params: {
    environment?: DeployEnvironment;
    status?: DeployStatus;
    health?: DeployHealth;
    projectId?: string;
    limit?: number;
    cursor?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.environment) query.set("environment", params.environment);
  if (params.status) query.set("status", params.status);
  if (params.health) query.set("health", params.health);
  if (params.projectId) query.set("projectId", params.projectId);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return apiFetch<{
    data: Deployment[];
    hasNextPage: boolean;
    nextCursor: string | null;
  }>(
    `/api/organizations/${organizationId}/deployments${qs ? `?${qs}` : ""}`,
  );
}

export function getDeployment(deploymentId: string, signal?: AbortSignal) {
  return apiFetch<Deployment>(`/api/deployments/${deploymentId}`, { signal });
}

export function updateDeploymentStatus(
  deploymentId: string,
  status: "SUCCESS" | "FAILED",
  notes?: string,
) {
  return apiFetch<Deployment>(`/api/deployments/${deploymentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, notes }),
  });
}

export function reportDeploymentHealth(
  deploymentId: string,
  health: "HEALTHY" | "DEGRADED" | "UNHEALTHY",
  notes?: string,
) {
  return apiFetch<Deployment>(`/api/deployments/${deploymentId}/health`, {
    method: "POST",
    body: JSON.stringify({ health, notes }),
  });
}

export function rollbackDeployment(
  deploymentId: string,
  targetDeploymentId: string,
  reason?: string,
) {
  return apiFetch<Deployment>(`/api/deployments/${deploymentId}/rollback`, {
    method: "POST",
    body: JSON.stringify({ targetDeploymentId, reason }),
  });
}

export function getDoraMetrics(
  organizationId: string,
  params: { environment?: DeployEnvironment; days?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.environment) query.set("environment", params.environment);
  if (params.days) query.set("days", String(params.days));
  const qs = query.toString();
  return apiFetch<DoraMetrics>(
    `/api/organizations/${organizationId}/deployments/metrics/dora${qs ? `?${qs}` : ""}`,
  );
}
