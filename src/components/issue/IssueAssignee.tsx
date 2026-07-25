"use client";

import { useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownCheckItem,
  DropdownSeparator,
} from "@/components/ui/Dropdown";
import { Avatar } from "@/components/ui/Avatar";
import { apiFetch, isAbortError } from "@/lib/api";
import type { Member, PaginatedResponse } from "@/types";
import { cn } from "@/lib/utils";

export function IssueAssigneeControl({
  organizationId,
  assignee,
  onChange,
  disabled,
  canAssign,
}: {
  organizationId: string | undefined;
  assignee: { id: string; name: string } | null;
  onChange: (assigneeId: string | null) => void;
  disabled?: boolean;
  /** UX-layer only, mirrors lib/permissions.ts convention: backend's own
   * requireRole("MEMBER") check on PATCH /issues/:issueId is the real
   * enforcement. This just avoids showing an interactive control to a
   * VIEWER who'd only get a 403 back. */
  canAssign: boolean;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Which organizationId `members`/`loaded` currently reflect. Compared
  // against the current `organizationId` prop at fetch-time (inside an
  // event handler, not an effect) so switching orgs invalidates the cache
  // without needing a reset-on-prop-change effect.
  const loadedForOrg = useRef<string | undefined>(undefined);

  // Members are only fetched once the dropdown is actually opened, not on
  // mount — every issue detail page render would otherwise fire an org
  // member list request whether or not the viewer ever touches this
  // control. Cached for as long as organizationId doesn't change.
  async function ensureMembersLoaded() {
    if (!organizationId) return;
    if (loaded && loadedForOrg.current === organizationId) return;
    try {
      const res = await apiFetch<PaginatedResponse<Member>>(
        `/api/organizations/${organizationId}/members?limit=100`,
      );
      setMembers(res.data);
      setLoaded(true);
      loadedForOrg.current = organizationId;
    } catch (err) {
      if (isAbortError(err)) return;
      console.error("Failed to load organization members", err);
    }
  }

  if (!canAssign) {
    return assignee ? (
      <div className="flex items-center gap-1.5">
        <Avatar name={assignee.name} size="sm" tone="subtle" />
        <span className="text-text">{assignee.name}</span>
      </div>
    ) : (
      <span className="text-text-subtle">Unassigned</span>
    );
  }

  return (
    <Dropdown onOpenChange={(open) => open && void ensureMembersLoaded()}>
      <span
        key={assignee?.id ?? "unassigned"}
        className="inline-block animate-in zoom-in-95 fade-in duration-normal ease-standard"
      >
        <DropdownTrigger
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md text-sm",
            "transition-colors duration-fast disabled:opacity-50",
            "hover:bg-surface-hover",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
          )}
        >
          {assignee ? (
            <>
              <Avatar name={assignee.name} size="sm" tone="subtle" />
              <span className="text-text">{assignee.name}</span>
            </>
          ) : (
            <span className="text-text-subtle">Unassigned</span>
          )}
          <ChevronDown size={13} className="text-text-subtle" />
        </DropdownTrigger>
      </span>
      <DropdownContent align="start">
        <DropdownCheckItem
          checked={assignee === null}
          onSelect={() => onChange(null)}
        >
          <span className="flex items-center gap-2 text-text-subtle">
            <X size={13} />
            Unassigned
          </span>
        </DropdownCheckItem>
        <DropdownSeparator />
        {!loaded && (
          <div className="px-2 py-1.5 text-xs text-text-subtle">
            Loading members…
          </div>
        )}
        {loaded && members.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-text-subtle">
            No members found.
          </div>
        )}
        {members.map((m) => (
          <DropdownCheckItem
            key={m.userId}
            checked={assignee?.id === m.userId}
            onSelect={() => onChange(m.userId)}
          >
            <span className="flex items-center gap-2">
              <Avatar name={m.user.name} size="sm" tone="subtle" />
              {m.user.name}
            </span>
          </DropdownCheckItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
