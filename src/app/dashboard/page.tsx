"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/OrgContext";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export default function DashboardPage() {
  const { currentOrg, loading: orgLoading } = useOrg();
  const [projects, setProjects] = useState<Project[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentOrg) return;
    // Since M1, this endpoint returns { data, hasNextPage, nextCursor },
    // not a bare array.
    apiFetch(`/api/organizations/${currentOrg.id}/projects`)
      .then((res: PaginatedResponse<Project>) => {
        setProjects(res.data);
        setNextCursor(res.nextCursor);
      })
      .catch(() => {
        setProjects([]);
        setNextCursor(null);
      });
  }, [currentOrg]);

  async function loadMore() {
    if (!currentOrg || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res: PaginatedResponse<Project> = await apiFetch(
        `/api/organizations/${currentOrg.id}/projects?cursor=${encodeURIComponent(nextCursor)}`,
      );
      setProjects((prev) => [...prev, ...res.data]);
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setError("");
    try {
      const project = await apiFetch(
        `/api/organizations/${currentOrg.id}/projects`,
        { method: "POST", body: JSON.stringify({ name: newName }) },
      );
      setProjects((prev) => [project, ...prev]);
      setNewName("");
      setCreating(false);
    } catch {
      setError("Could not create project — check your role permissions");
    }
  }

  // Role-aware UI: hiding this for VIEWER is UX only — the backend's
  // requireRole("MEMBER") is the real enforcement.
  const canCreate =
    currentOrg != null &&
    ["ADMIN", "MANAGER", "MEMBER"].includes(currentOrg.role);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50">
        <DashboardHeader />

        <main className="max-w-5xl mx-auto px-6 py-10">
          {orgLoading && (
            <p className="text-sm text-zinc-400">Loading organizations…</p>
          )}

          {!orgLoading && !currentOrg && (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center">
              <p className="text-zinc-500">
                You don&apos;t belong to any organization yet.
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Create one from the switcher above to get started.
              </p>
            </div>
          )}

          {currentOrg && (
            <>
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    Projects
                  </h1>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {currentOrg.name}
                  </p>
                </div>

                {canCreate && !creating && (
                  <button
                    onClick={() => setCreating(true)}
                    className="text-sm font-medium bg-zinc-900 text-white px-3.5 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    New project
                  </button>
                )}
              </div>

              {creating && (
                <form
                  onSubmit={handleCreateProject}
                  className="mb-6 flex gap-2 rounded-lg border border-zinc-200 bg-white p-2"
                >
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Project name"
                    className="flex-1 px-2 py-1.5 text-sm focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="text-sm font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setNewName("");
                    }}
                    className="text-sm text-zinc-500 px-2 hover:text-zinc-700"
                  >
                    Cancel
                  </button>
                </form>
              )}
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

              {projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center">
                  <p className="text-zinc-500">No projects yet.</p>
                  {canCreate && (
                    <p className="text-sm text-zinc-400 mt-1">
                      Create your first project to start tracking issues.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/projects/${p.id}`}
                      className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors">
                          {p.name}
                        </span>
                        <svg
                          className="h-4 w-4 text-zinc-300 group-hover:text-indigo-400 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                      {p.description && (
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {nextCursor && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
