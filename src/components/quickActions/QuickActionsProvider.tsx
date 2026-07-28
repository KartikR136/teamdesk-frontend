"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { apiFetch, isAbortError } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type {
  Issue,
  IssuePriority,
  PaginatedResponse,
  Project,
  Sprint,
} from "@/types";
import { ISSUE_PRIORITIES } from "@/types";

/* ── Context ────────────────────────────────────────────────────────────
 * A single provider mounted once in DashboardShell so the "Create Issue" /
 * "Create Project" / "Create Sprint" dialogs can be triggered from
 * anywhere: the Quick Actions widget, the command palette, and the
 * global keyboard-shortcut hook, without three separate copies of this
 * dialog state scattered across those call sites. */

interface QuickActionsContextValue {
  openCreateIssue: (opts?: { projectId?: string }) => void;
  openCreateProject: () => void;
  openCreateSprint: (opts?: { projectId?: string }) => void;
}

const QuickActionsContext = createContext<QuickActionsContextValue | null>(null);

export function useQuickActions() {
  const ctx = useContext(QuickActionsContext);
  if (!ctx) throw new Error("useQuickActions must be used within QuickActionsProvider");
  return ctx;
}

type DialogKind = "issue" | "project" | "sprint" | null;

export function QuickActionsProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [presetProjectId, setPresetProjectId] = useState<string | undefined>(undefined);

  const openCreateIssue = useCallback((opts?: { projectId?: string }) => {
    setPresetProjectId(opts?.projectId);
    setDialog("issue");
  }, []);
  const openCreateProject = useCallback(() => setDialog("project"), []);
  const openCreateSprint = useCallback((opts?: { projectId?: string }) => {
    setPresetProjectId(opts?.projectId);
    setDialog("sprint");
  }, []);

  return (
    <QuickActionsContext.Provider value={{ openCreateIssue, openCreateProject, openCreateSprint }}>
      {children}
      <CreateIssueDialog
        open={dialog === "issue"}
        presetProjectId={presetProjectId}
        onClose={() => setDialog(null)}
      />
      <CreateProjectDialog open={dialog === "project"} onClose={() => setDialog(null)} />
      <CreateSprintDialog
        open={dialog === "sprint"}
        presetProjectId={presetProjectId}
        onClose={() => setDialog(null)}
      />
    </QuickActionsContext.Provider>
  );
}

/* ── Shared bits ───────────────────────────────────────────────────────── */

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-text">
      {children}
    </label>
  );
}

const selectClass =
  "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover transition-colors duration-normal disabled:opacity-50 disabled:cursor-not-allowed";

function useProjectsForOrg(open: boolean) {
  const { currentOrg } = useOrg();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentOrg) return;
    const controller = new AbortController();
    setLoading(true);
    apiFetch<PaginatedResponse<Project>>(
      `/api/organizations/${currentOrg.id}/projects?limit=100`,
      { signal: controller.signal },
    )
      .then((res) => setProjects(res.data))
      .catch((err) => {
        if (!isAbortError(err)) setProjects([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, currentOrg]);

  return { projects, loading };
}

/* ── Create Issue ──────────────────────────────────────────────────────── */

function CreateIssueDialog({
  open,
  presetProjectId,
  onClose,
}: {
  open: boolean;
  presetProjectId?: string;
  onClose: () => void;
}) {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const notify = useNotify();
  const { projects, loading: projectsLoading } = useProjectsForOrg(open);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");
  const [sprintId, setSprintId] = useState("");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form each time the dialog opens, seeding the project from
  // wherever it was opened (e.g. a project page's own "New issue" flow
  // routed through Quick Actions instead of duplicating the form).
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setProjectId(presetProjectId ?? "");
      setPriority("MEDIUM");
      setSprintId("");
      setError("");
    }
  }, [open, presetProjectId]);

  // Sprints are project-scoped, so re-fetch whenever the chosen project
  // changes. Cleared immediately on change so a stale sprint from the
  // previous project can never be silently submitted.
  useEffect(() => {
    setSprintId("");
    if (!projectId || !currentOrg) {
      setSprints([]);
      return;
    }
    const controller = new AbortController();
    apiFetch<PaginatedResponse<Sprint>>(
      `/api/organizations/${currentOrg.id}/sprints?projectId=${projectId}&limit=50`,
      { signal: controller.signal },
    )
      .then((res) => setSprints(res.data.filter((s) => s.status !== "COMPLETED")))
      .catch((err) => {
        if (!isAbortError(err)) setSprints([]);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentOrg?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg || !projectId) return;
    setSubmitting(true);
    setError("");
    try {
      const issue = await apiFetch<Issue>(`/api/organizations/${currentOrg.id}/issues`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          projectId,
          priority,
          sprintId: sprintId || undefined,
        }),
      });
      notify.success("Issue created", title);
      onClose();
      router.push(`/dashboard/projects/${projectId}/issues/${issue.id}`);
    } catch {
      setError("Could not create issue — check your permissions.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogTitle>Create issue</DialogTitle>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="qa-issue-title">Title</FieldLabel>
            <Input
              id="qa-issue-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the issue…"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="qa-issue-project">Project</FieldLabel>
            <select
              id="qa-issue-project"
              className={selectClass}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={projectsLoading}
              required
            >
              <option value="" disabled>
                {projectsLoading ? "Loading projects…" : "Select a project…"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="qa-issue-priority">Priority</FieldLabel>
              <select
                id="qa-issue-priority"
                className={selectClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
              >
                {ISSUE_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="qa-issue-sprint">Sprint</FieldLabel>
              <select
                id="qa-issue-sprint"
                className={selectClass}
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                disabled={!projectId || sprints.length === 0}
              >
                <option value="">
                  {!projectId
                    ? "Pick a project first"
                    : sprints.length === 0
                      ? "No open sprints"
                      : "Backlog (no sprint)"}
                </option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.status === "ACTIVE" ? "· active" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="qa-issue-description">Description (optional)</FieldLabel>
            <textarea
              id="qa-issue-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more context…"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover transition-colors duration-normal resize-none"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={12} />
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting} disabled={!title || !projectId}>
              Create issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Create Project ────────────────────────────────────────────────────── */

function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const notify = useNotify();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setSubmitting(true);
    setError("");
    try {
      const project = await apiFetch<Project>(
        `/api/organizations/${currentOrg.id}/projects`,
        { method: "POST", body: JSON.stringify({ name, description: description || undefined }) },
      );
      notify.success("Project created", project.name);
      onClose();
      router.push(`/dashboard/projects/${project.id}`);
    } catch {
      setError("Could not create project — check your permissions.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogTitle>Create project</DialogTitle>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="qa-project-name">Name</FieldLabel>
            <Input
              id="qa-project-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name…"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="qa-project-description">Description (optional)</FieldLabel>
            <textarea
              id="qa-project-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this project for?"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover transition-colors duration-normal resize-none"
            />
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={12} />
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting} disabled={!name}>
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Create Sprint ─────────────────────────────────────────────────────── */

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function CreateSprintDialog({
  open,
  presetProjectId,
  onClose,
}: {
  open: boolean;
  presetProjectId?: string;
  onClose: () => void;
}) {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const notify = useNotify();
  const { projects, loading: projectsLoading } = useProjectsForOrg(open);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState(todayPlus(0));
  const [endDate, setEndDate] = useState(todayPlus(14));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setGoal("");
      setProjectId(presetProjectId ?? "");
      setStartDate(todayPlus(0));
      setEndDate(todayPlus(14));
      setError("");
    }
  }, [open, presetProjectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg || !projectId) return;
    setSubmitting(true);
    setError("");
    try {
      const sprint = await apiFetch<Sprint>(`/api/organizations/${currentOrg.id}/sprints`, {
        method: "POST",
        body: JSON.stringify({
          name,
          goal: goal || undefined,
          projectId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        }),
      });
      notify.success("Sprint created", sprint.name);
      onClose();
      router.push(`/dashboard/sprints/${sprint.id}`);
    } catch {
      setError("Could not create sprint — check the dates and your permissions.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogTitle>Create sprint</DialogTitle>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="qa-sprint-name">Name</FieldLabel>
            <Input
              id="qa-sprint-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 14"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="qa-sprint-project">Project</FieldLabel>
            <select
              id="qa-sprint-project"
              className={selectClass}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={projectsLoading}
              required
            >
              <option value="" disabled>
                {projectsLoading ? "Loading projects…" : "Select a project…"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="qa-sprint-start">Start date</FieldLabel>
              <Input
                id="qa-sprint-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="qa-sprint-end">End date</FieldLabel>
              <Input
                id="qa-sprint-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="qa-sprint-goal">Goal (optional)</FieldLabel>
            <textarea
              id="qa-sprint-goal"
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What should this sprint achieve?"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover transition-colors duration-normal resize-none"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={12} />
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting} disabled={!name || !projectId}>
              Create sprint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
