"use client";

import { Building2 } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { useOrg } from "@/providers/OrgProvider";
import { cn } from "@/lib/utils";

export function OrgContextPanel({ collapsed }: { collapsed: boolean }) {
  const { currentOrg } = useOrg();

  if (!currentOrg) return null;

  if (collapsed) {
    return (
      <div
        className="flex items-center justify-center py-3 mx-2 mb-1 rounded-lg bg-primary-subtle"
        title={`${currentOrg.name} · ${currentOrg.role}`}
        aria-label={`Current org: ${currentOrg.name}`}
      >
        <span className="text-sm font-bold text-primary">
          {currentOrg.name[0]?.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("mx-2 mb-3 rounded-xl border border-border bg-background-subtle px-3.5 py-3")}>
      {/* Org initial + name */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="h-7 w-7 rounded-lg bg-primary-subtle flex items-center justify-center text-sm font-bold text-primary shrink-0">
          {currentOrg.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text truncate leading-tight">
            {currentOrg.name}
          </p>
          <p className="text-[11px] text-text-subtle font-mono truncate">
            {currentOrg.slug}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">Your role</span>
        <RoleBadge role={currentOrg.role} />
      </div>
    </div>
  );
}
