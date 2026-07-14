"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FolderPlus, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { Organization, PaginatedResponse, Project } from "@/types";

type SortMode = "newest" | "oldest" | "az" | "za";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "A–Z" },
  { value: "za", label: "Z–A" },
];

function sortProjects(projects: Project[], mode: SortMode): Project[] {
  const copy = [...projects];
  switch (mode) {
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "az":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "za":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
  }
}

export function ProjectsSection({
  org,
  onCountChange,
}: {
  org: Organization;
  onCountChange?: (count: number, hasMore: boolean) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<Project>>(
          `/api/organizations/${org.id}/projects`,
        );
        setProjects(res.data);
        setNextCursor(res.nextCursor);
        onCountChange?.(res.data.length, res.hasNextPage);
      } catch {
        setProjects([]);
        setNextCursor(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await apiFetch<PaginatedResponse<Project>>(
        `/api/organizations/${org.id}/projects?cursor=${encodeURIComponent(nextCursor)}`,
      );
      setProjects((prev) => {
        const combined = [...prev, ...res.data];
        onCountChange?.(combined.length, res.hasNextPage);
        return combined;
      });
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const project = await apiFetch<Project>(`/api/organizations/${org.id}/projects`, {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      });
      setProjects((prev) => {
        const combined = [project, ...prev];
        onCountChange?.(combined.length, nextCursor !== null);
        return combined;
      });
      setNewName("");
      setCreating(false);
    } catch {
      setError("Could not create project — check your role permissions");
    }
  }

  // Role-aware UI: hiding this for VIEWER is UX only — the backend's
  // requireRole("MEMBER") is the real enforcement.
  const canCreate = ["ADMIN", "MANAGER", "MEMBER"].includes(org.role);

  // Search + sort run entirely against the already-loaded page(s) of
  // projects. This is NOT a global org-wide search — with cursor
  // pagination there's no server-side search endpoint to call, and
  // fetching every page upfront just to search client-side would
  // reintroduce the offset-style cost M1 deliberately avoided. Labeled
  // honestly in the placeholder text below rather than implying it
  // searches the whole organization.
  const visibleProjects = useMemo(() => {
    const filtered = query.trim()
      ? projects.filter((p) =>
          p.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : projects;
    return sortProjects(filtered, sortMode);
  }, [projects, query, sortMode]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-text">Projects</h2>
        {canCreate && !creating && (
          <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
            New project
          </Button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreateProject} className="mb-4 flex gap-2">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            required
          />
          <Button type="submit" size="sm">
            Create
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
          >
            Cancel
          </Button>
        </form>
      )}
      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      {!loading && projects.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search loaded projects…"
              className="pl-8"
            />
          </div>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortMode(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-fast",
                  sortMode === opt.value
                    ? "bg-primary-subtle text-primary-subtle-text"
                    : "text-text-muted hover:bg-surface-hover",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed px-8 py-14 text-center">
          <FolderPlus size={28} className="mx-auto text-text-subtle mb-3" />
          <p className="text-text-muted">You don&apos;t have any projects yet.</p>
          <p className="text-sm text-text-subtle mt-1">
            {canCreate
              ? "Create your first project to start tracking issues."
              : "Ask an admin or manager to create one."}
          </p>
        </Card>
      ) : visibleProjects.length === 0 ? (
        <Card className="border-dashed px-8 py-10 text-center">
          <p className="text-text-muted">
            No loaded projects match &ldquo;{query}&rdquo;.
          </p>
          <p className="text-sm text-text-subtle mt-1">
            Try a different search, or load more projects below first.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleProjects.map((p) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                <Card className="group p-4 h-full flex flex-col justify-between hover:border-border-hover hover:shadow-sm transition-all duration-normal">
                  <div>
                    <span className="font-medium text-text group-hover:text-primary transition-colors">
                      {p.name}
                    </span>
                    {p.description && (
                      <p className="text-sm text-text-muted mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-subtle group-hover:text-primary mt-3 transition-colors">
                    Open
                    <ChevronRight size={14} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {nextCursor && !query && (
            <div className="mt-4 text-center">
              <Button variant="link" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
