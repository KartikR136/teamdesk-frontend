"use client";

import { ChevronDown } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownCheckItem,
} from "@/components/ui/Dropdown";
import { ISSUE_STATUSES, type IssueStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<IssueStatus, string> = {
  TODO: "bg-surface-hover text-text-muted",
  IN_PROGRESS: "bg-primary-subtle text-primary-subtle-text",
  IN_REVIEW: "bg-warning-subtle text-warning",
  DONE: "bg-success-subtle text-success",
};

// A "stage dial" rather than a flat colored pill: four bars, filled up to
// the issue's current stage in ISSUE_STATUSES order. This deliberately
// reuses the exact idea behind RoleBadge — visual weight communicates
// rank — but applied to workflow progress instead of permission level.
// Two places in the product now speak the same design language for two
// different kinds of hierarchy, which is what makes it feel like one
// system rather than a component library with unrelated pieces.
function StageDial({ status }: { status: IssueStatus }) {
  const stageIndex = ISSUE_STATUSES.findIndex((s) => s.value === status);
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {ISSUE_STATUSES.map((s, i) => (
        <span
          key={s.value}
          className={cn(
            "h-1 w-3 rounded-full transition-colors duration-normal ease-standard",
            i <= stageIndex ? "bg-current opacity-90" : "bg-current opacity-15",
          )}
        />
      ))}
    </span>
  );
}

export function IssueStatusControl({
  status,
  onChange,
  disabled,
}: {
  status: IssueStatus;
  onChange: (status: IssueStatus) => void;
  disabled?: boolean;
}) {
  const currentLabel =
    ISSUE_STATUSES.find((s) => s.value === status)?.label ?? status;

  return (
    <Dropdown>
      {/* Keyed on status so a confirmed change remounts this span and
          replays the pop-in animation — a small, honest confirmation that
          the change actually landed, distinct from a page-load animation. */}
      <span
        key={status}
        className="inline-block animate-in zoom-in-95 fade-in duration-normal ease-standard"
      >
        <DropdownTrigger
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-sm font-medium",
            "transition-colors duration-fast disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
            STATUS_STYLES[status],
          )}
        >
          <StageDial status={status} />
          {currentLabel}
          <ChevronDown size={13} />
        </DropdownTrigger>
      </span>
      <DropdownContent align="start">
        {ISSUE_STATUSES.map((s) => (
          <DropdownCheckItem
            key={s.value}
            checked={s.value === status}
            onSelect={() => onChange(s.value)}
          >
            <span className="flex items-center gap-2">
              <StageDial status={s.value} />
              {s.label}
            </span>
          </DropdownCheckItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
