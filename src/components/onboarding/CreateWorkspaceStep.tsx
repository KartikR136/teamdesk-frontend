"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { apiFetch } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import type { Organization } from "@/types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Step 1 of onboarding: create the organization. Calls the exact same
 * POST /api/organizations endpoint OrgSwitcher.tsx already uses — no new
 * backend surface. The slug derivation is copied verbatim from
 * OrgSwitcher.tsx rather than reimplemented differently, so the two
 * creation entry points (onboarding vs. the in-app switcher) can never
 * silently diverge in behavior.
 */
export function CreateWorkspaceStep({
  onCreated,
}: {
  onCreated: (org: Organization) => void;
}) {
  const notify = useNotify();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const org = await apiFetch<Organization>("/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name, slug: slugify(name) }),
      });
      onCreated(org);
    } catch {
      setError("Could not create workspace. That name may already be taken.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text tracking-tight mb-1.5">
        Create your workspace
      </h1>
      <p className="text-sm text-text-muted mb-6">
        This is where your team&apos;s projects, issues, and members will live.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Workspace name"
          placeholder="Acme Engineering"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />

        {name.trim() && (
          <p className="text-xs text-text-subtle -mt-2">
            Workspace URL: <span className="font-mono">{slugify(name)}</span>
          </p>
        )}

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full mt-1" disabled={submitting || !name.trim()}>
          {submitting ? "Creating…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
