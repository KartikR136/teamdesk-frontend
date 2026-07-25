"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderKanban, Plus, ChevronRight, AlertCircle } from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, EmptyStateCard } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Project, PaginatedResponse } from "@/types";

export default function ProjectsPage() {
  const { currentOrg } = useOrg();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!currentOrg) return;
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<Project>>(
          `/api/organizations/${currentOrg.id}/projects?limit=50`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setProjects(res.data);
      } catch {
        if (controller.signal.aborted) return;
        setProjects([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [currentOrg]);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setCreateError("");
    try {
      const project = await apiFetch<Project>(
        `/api/organizations/${currentOrg.id}/projects`,
        { method: "POST", body: JSON.stringify({ name }) },
      );
      setProjects((prev) => [project, ...prev]);
      setName("");
      setCreating(false);
    } catch {
      setCreateError("Could not create project — check your permissions.");
    }
  }

  const canCreate =
    currentOrg && ["ADMIN", "MANAGER", "MEMBER"].includes(currentOrg.role);

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text">
                Projects
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"} in{" "}
                {currentOrg?.name ?? "this organization"}
              </p>
            </div>
            {canCreate && !creating && (
              <Button
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setCreating(true)}
              >
                New project
              </Button>
            )}
          </div>

          {creating && (
            <motion.form
              onSubmit={handleCreateProject}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden mb-5"
            >
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name…"
                  required
                />
                <Button type="submit" size="sm">
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
              {createError && (
                <p className="flex items-center gap-1.5 text-xs text-danger mt-2">
                  <AlertCircle size={12} />
                  {createError}
                </p>
              )}
            </motion.form>
          )}

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-pill" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyStateCard>
              <EmptyState
                icon={<FolderKanban size={30} />}
                title="No projects yet"
                description="Create a project to start organizing issues for your team."
                action={
                  canCreate ? (
                    <Button
                      size="sm"
                      leftIcon={<Plus size={14} />}
                      onClick={() => setCreating(true)}
                    >
                      New project
                    </Button>
                  ) : undefined
                }
              />
            </EmptyStateCard>
          ) : (
            <ul className="space-y-1.5">
              {projects.map((project, i) => (
                <motion.li
                  key={project.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5",
                        "hover:border-border-hover hover:shadow-sm hover:-translate-y-px",
                        "transition-all duration-normal",
                      )}
                    >
                      <FolderKanban
                        size={17}
                        className="text-text-subtle shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-text-subtle truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                      {project._count && (
                        <span className="text-xs text-text-subtle shrink-0">
                          {project._count.issues} open
                        </span>
                      )}
                      <ChevronRight
                        size={14}
                        className="text-text-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                      />
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
