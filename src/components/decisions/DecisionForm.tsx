"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { apiFetch } from "@/lib/api";
import type { Decision, Issue, PaginatedResponse, Project } from "@/types";

export interface DecisionFormValues {
  title: string;
  problemStatement: string;
  context: string;
  alternatives: string;
  chosenSolution: string;
  tradeoffs: string;
  consequences: string;
  projectId: string;
  reviewDate: string;
  relatedIssueIds: string[];
}

function toFormValues(decision?: Decision): DecisionFormValues {
  return {
    title: decision?.title ?? "",
    problemStatement: decision?.problemStatement ?? "",
    context: decision?.context ?? "",
    alternatives: decision?.alternatives ?? "",
    chosenSolution: decision?.chosenSolution ?? "",
    tradeoffs: decision?.tradeoffs ?? "",
    consequences: decision?.consequences ?? "",
    projectId: decision?.projectId ?? "",
    reviewDate: decision?.reviewDate ? decision.reviewDate.slice(0, 10) : "",
    relatedIssueIds:
      decision?.relatedIssues?.map((r) => r.issue.id) ?? [],
  };
}

/**
 * A textarea styled to match Input.tsx's tokens exactly (same border,
 * focus ring, radius) — there's no shared Textarea primitive in
 * components/ui/ yet, and per DESIGN_SYSTEM.md's own stated rule ("added
 * when a milestone's actual page work requires one, not speculatively"),
 * this milestone is exactly that trigger. Kept local to this form rather
 * than promoted to components/ui/ until a second consumer actually needs
 * it — promoting on first use would be speculative reuse.
 */
function Textarea({
  label,
  value,
  onChange,
  required,
  maxLength,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  maxLength?: number;
  rows?: number;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        rows={rows}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors duration-normal ease-standard focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover resize-y"
      />
    </div>
  );
}

/**
 * Shared create/edit form for Decision Log entries. Used by both
 * /dashboard/decisions/new and the edit mode on the detail page — one
 * implementation, so the two entry points can't silently diverge in
 * which fields exist or how they validate, the same reasoning
 * CreateWorkspaceStep.tsx copying OrgSwitcher's slugify logic verbatim
 * was built on in Milestone 2.
 *
 * Field length caps (title 200, long-text fields 5000) mirror the exact
 * limits enforced server-side in decisions.ts's Zod schema — enforced
 * here too so a user hits a clear inline limit instead of a a confusing
 * 400 after typing a long entry.
 */
export function DecisionForm({
  organizationId,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  organizationId: string;
  initial?: Decision;
  submitLabel: string;
  onSubmit: (values: DecisionFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<DecisionFormValues>(() =>
    toFormValues(initial),
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // First page only of each — same "already-loaded pages" honesty
  // convention ProjectsSection.tsx already established, since cursor
  // pagination has no server-side search to page through everything.
  useEffect(() => {
    void (async () => {
      try {
        const [projectsRes, issuesRes] = await Promise.all([
          apiFetch<PaginatedResponse<Project>>(
            `/api/organizations/${organizationId}/projects`,
          ),
          apiFetch<PaginatedResponse<Issue>>(
            `/api/organizations/${organizationId}/issues`,
          ),
        ]);
        setProjects(projectsRes.data);
        setIssues(issuesRes.data);
      } catch {
        setProjects([]);
        setIssues([]);
      }
    })();
  }, [organizationId]);

  function update<K extends keyof DecisionFormValues>(
    key: K,
    value: DecisionFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleIssue(issueId: string) {
    setValues((prev) => ({
      ...prev,
      relatedIssueIds: prev.relatedIssueIds.includes(issueId)
        ? prev.relatedIssueIds.filter((id) => id !== issueId)
        : [...prev.relatedIssueIds, issueId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch {
      setError("Could not save this decision. Please check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField
        label="Title"
        value={values.title}
        onChange={(e) => update("title", e.target.value)}
        maxLength={200}
        required
      />

      <Textarea
        label="Problem statement"
        value={values.problemStatement}
        onChange={(v) => update("problemStatement", v)}
        maxLength={5000}
        required
      />

      <Textarea
        label="Context"
        value={values.context}
        onChange={(v) => update("context", v)}
        maxLength={5000}
        required
      />

      <Textarea
        label="Alternatives considered"
        value={values.alternatives}
        onChange={(v) => update("alternatives", v)}
        maxLength={5000}
        required
      />

      <Textarea
        label="Chosen solution"
        value={values.chosenSolution}
        onChange={(v) => update("chosenSolution", v)}
        maxLength={5000}
        required
      />

      <Textarea
        label="Trade-offs"
        value={values.tradeoffs}
        onChange={(v) => update("tradeoffs", v)}
        maxLength={5000}
        required
      />

      <Textarea
        label="Consequences (optional)"
        value={values.consequences}
        onChange={(v) => update("consequences", v)}
        maxLength={5000}
        rows={3}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="related-project" className="text-sm font-medium text-text">
            Related project (optional)
          </label>
          <select
            id="related-project"
            value={values.projectId}
            onChange={(e) => update("projectId", e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover transition-colors duration-normal"
          >
            <option value="">No related project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <FormField
          label="Review date (optional)"
          type="date"
          value={values.reviewDate}
          onChange={(e) => update("reviewDate", e.target.value)}
        />
      </div>

      {issues.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text mb-1.5">
            Related issues (optional)
          </p>
          <p className="text-xs text-text-subtle mb-2">
            Only issues from already-loaded pages are shown here.
          </p>
          <div className="border border-border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
            {issues.map((issue) => (
              <label
                key={issue.id}
                className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={values.relatedIssueIds.includes(issue.id)}
                  onChange={() => toggleIssue(issue.id)}
                  className="accent-primary"
                />
                <span className="text-text truncate">{issue.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
