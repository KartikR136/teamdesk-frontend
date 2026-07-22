"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { apiFetch } from "@/lib/api";
import { useNotify } from "@/lib/notifications";

/**
 * Step 3 of onboarding: create the first project. Optional and skippable,
 * same reasoning as InviteTeamStep. Calls the same
 * POST /api/organizations/:id/projects endpoint ProjectsSection.tsx uses.
 */
export function CreateProjectStep({
  organizationId,
  onDone,
}: {
  organizationId: string;
  onDone: () => void;
}) {
  const notify = useNotify();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch(`/api/organizations/${organizationId}/projects`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      notify.success("Project created", `${name} is ready for issues.`);
      onDone();
    } catch {
      notify.error("Could not create project", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text tracking-tight mb-1.5">
        Create your first project
      </h1>
      <p className="text-sm text-text-muted mb-6">
        Projects hold issues. You can always create more later.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Project name"
          placeholder="Website Redesign"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div className="flex items-center gap-2">
          <Button type="submit" size="lg" className="flex-1" disabled={submitting || !name.trim()}>
            {submitting ? "Creating…" : "Create project"}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onDone}>
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}
