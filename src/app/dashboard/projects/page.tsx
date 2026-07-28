"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Plus,
  ArrowRight,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
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

/* A small deterministic accent per project so the grid doesn't look like
   a wall of identical cards — picked from the project id, not random,
   so it stays stable across renders/reloads. */
const ACCENTS = [
  "bg-primary-subtle text-primary",
  "bg-info-subtle text-info",
  "bg-success-subtle text-success",
  "bg-warning-subtle text-warning",
];

function accentFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectsPage() {
  const { currentOrg } = useOrg();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
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

  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [projects, query]);

  const totalOpenIssues = projects.reduce(
    (sum, p) => sum + (p._count?.issues ?? 0),
    0,
  );

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-text mb-1">
                Projects
              </h1>
              <p className="text-sm text-text-muted">
                {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"} ·{" "}
                {totalOpenIssues} open issues in{" "}
                {currentOrg?.name ?? "this organization"}
              </p>
            </div>
            {canCreate && !creating && (
              <Button
                leftIcon={<Plus size={14} />}
                onClick={() => setCreating(true)}
              >
                New project
              </Button>
            )}
          </div>

          {/* Inline create form */}
          {creating && (
            <motion.form
              onSubmit={handleCreateProject}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden mb-6 rounded-xl border border-border bg-surface p-4"
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

          {/* Search */}
          {!loading && projects.length > 0 && (
            <div className="mb-6 max-w-sm">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter projects…"
                leftSlot={<Search size={14} />}
                rightSlot={
                  query ? (
                    <button
                      onClick={() => setQuery("")}
                      className="pointer-events-auto text-text-subtle hover:text-text"
                      aria-label="Clear filter"
                    >
                      <X size={14} />
                    </button>
                  ) : undefined
                }
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <Skeleton className="h-10 w-10 rounded-xl mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && projects.length === 0 && (
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
          )}

          {/* No search results */}
          {!loading && projects.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-text-muted py-12 text-center">
              No projects match &ldquo;{query}&rdquo;.
            </p>
          )}

          {/* Card grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.3 }}
                >
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <div
                      className={cn(
                        "group relative h-full flex flex-col rounded-2xl border border-border bg-surface p-5",
                        "hover:border-border-hover hover:shadow-md hover:-translate-y-0.5",
                        "transition-all duration-normal",
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0",
                            accentFor(project.id),
                          )}
                        >
                          {initials(project.name) || <FolderKanban size={16} />}
                        </div>
                        <ArrowRight
                          size={16}
                          className="text-text-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-2"
                        />
                      </div>

                      <p className="text-sm font-semibold text-text mb-1 leading-snug truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-text-subtle leading-relaxed line-clamp-2 mb-4 flex-1">
                        {project.description || "No description yet."}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-text-subtle">
                        <span>{formatDate(project.createdAt)}</span>
                        {project._count && (
                          <span className="font-medium text-text-muted">
                            {project._count.issues} open
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
