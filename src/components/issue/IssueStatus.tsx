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

export function IssueStatusControl({
  status,
  onChange,
  disabled,
}: {
  status: IssueStatus;
  onChange: (status: IssueStatus) => void;
  disabled?: boolean;
}) {
  const currentLabel = ISSUE_STATUSES.find((s) => s.value === status)?.label ?? status;

  return (
    <Dropdown>
      <DropdownTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium",
          "transition-colors duration-fast disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
          STATUS_STYLES[status],
        )}
      >
        {currentLabel}
        <ChevronDown size={13} />
      </DropdownTrigger>
      <DropdownContent align="start">
        {ISSUE_STATUSES.map((s) => (
          <DropdownCheckItem
            key={s.value}
            checked={s.value === status}
            onSelect={() => onChange(s.value)}
          >
            {s.label}
          </DropdownCheckItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
