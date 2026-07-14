"use client";

import { ChevronDown } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownCheckItem,
} from "@/components/ui/Dropdown";
import { RoleBadge } from "@/components/RoleBadge";
import { ROLE_METADATA, ROLE_ORDER } from "@/lib/roles";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

export function RoleSelector({
  value,
  onChange,
  disabled,
  disabledReason,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
  /** Shown as a title attribute on the trigger when disabled, so the
   * control still explains itself rather than just going gray. */
  disabledReason?: string;
}) {
  return (
    <Dropdown>
      <DropdownTrigger
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className={cn(
          "inline-flex items-center gap-1 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-focus-ring/40 rounded-md",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <RoleBadge role={value} />
        {!disabled && <ChevronDown size={12} className="text-text-subtle" />}
      </DropdownTrigger>

      {!disabled && (
        <DropdownContent align="end" className="w-64">
          {ROLE_ORDER.map((role) => (
            <DropdownCheckItem
              key={role}
              checked={role === value}
              onSelect={() => onChange(role)}
              className="flex-col items-start gap-0"
            >
              <span className="text-sm font-medium text-text">
                {ROLE_METADATA[role].label}
              </span>
              <span className="text-xs text-text-subtle font-normal">
                {ROLE_METADATA[role].description}
              </span>
            </DropdownCheckItem>
          ))}
        </DropdownContent>
      )}
    </Dropdown>
  );
}
