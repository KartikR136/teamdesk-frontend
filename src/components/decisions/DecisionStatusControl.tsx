"use client";

import { ChevronDown } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownCheckItem,
} from "@/components/ui/Dropdown";
import { DECISION_STATUS_METADATA, DECISION_STATUS_ORDER } from "@/lib/decisions";
import { cn } from "@/lib/utils";
import type { DecisionStatus } from "@/types";

/**
 * Interactive status dropdown for the decision detail page — directly
 * mirrors IssueStatusControl.tsx's structure (same Dropdown primitives,
 * same disabled/focus-ring handling), applied to Decision's four
 * statuses instead of Issue's four. Deliberately not the same component:
 * the two status enums are unrelated (Decision status is a lifecycle —
 * draft/accepted/superseded/archived — not a workflow stage like Issue's
 * todo/in-progress/done), and forcing them to share one generic component
 * would need a type-erasing abstraction for no real reuse benefit.
 */
export function DecisionStatusControl({
  status,
  onChange,
  disabled,
}: {
  status: DecisionStatus;
  onChange: (status: DecisionStatus) => void;
  disabled?: boolean;
}) {
  const meta = DECISION_STATUS_METADATA[status];

  return (
    <Dropdown>
      <DropdownTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium",
          "transition-colors duration-fast disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
          meta.className,
        )}
      >
        {meta.label}
        <ChevronDown size={13} />
      </DropdownTrigger>
      <DropdownContent align="start" className="w-64">
        {DECISION_STATUS_ORDER.map((s) => (
          <DropdownCheckItem
            key={s}
            checked={s === status}
            onSelect={() => onChange(s)}
          >
            <span className="flex flex-col items-start">
              <span className="text-sm font-medium text-text">
                {DECISION_STATUS_METADATA[s].label}
              </span>
              <span className="text-xs text-text-subtle">
                {DECISION_STATUS_METADATA[s].description}
              </span>
            </span>
          </DropdownCheckItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
