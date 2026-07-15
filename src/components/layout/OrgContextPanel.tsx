"use client";

import { Building2 } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { useOrg } from "@/providers/OrgProvider";
import { cn } from "@/lib/utils";

// This is the one place in the sidebar meant to be remembered, not just
// used. Every dashboard page renders it, and it says the same thing every
// time: which organization's data you're looking at, and what your role
// in it is. That's the whole product thesis, made ambient rather than
// left implicit in a dropdown.
//
// Deliberately built from data useOrg() already holds (id, name, slug,
// role) — no new fetch. Member count was considered and left out for
// exactly that reason; see ARCHITECTURE.md's "Deferred UI Enhancements".
export function OrgContextPanel({ collapsed }: { collapsed: boolean }) {
  const { currentOrg } = useOrg();

  if (!currentOrg) return null;

  if (collapsed) {
    return (
      <div
        className="flex items-center justify-center py-3 mb-2 rounded-md border-l-2 border-primary bg-surface-hover/60"
        title={`${currentOrg.name} — your role: ${currentOrg.role}`}
      >
        <Building2 size={16} className="text-text-subtle" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-3 rounded-lg border-l-2 border-primary bg-surface-hover/60 px-3 py-3",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-text-subtle mb-2">
        <Building2 size={12} />
        Organization Context
      </div>

      <p className="text-sm font-semibold text-text truncate">
        {currentOrg.name}
      </p>
      <p className="text-xs text-text-subtle font-mono truncate">
        {currentOrg.slug}
      </p>

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs text-text-muted">Your role</span>
        <RoleBadge role={currentOrg.role} />
      </div>

      <p className="text-[11px] text-text-subtle mt-2.5 leading-snug border-t border-border pt-2">
        Access is scoped to this organization.
      </p>
    </div>
  );
}
