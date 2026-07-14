"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/Dropdown";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { RoleSelector } from "./RoleSelector";
import { isLastRemainingAdmin, getLastAdminBlockReason } from "@/lib/permissions";
import type { Member, Role } from "@/types";

export function MemberCard({
  member,
  members,
  allMembersLoaded,
  canManage,
  onRoleChange,
  onRemove,
}: {
  member: Member;
  /** Full current member list — needed to compute admin count. Passed
   * down rather than fetched here; this component stays pure-props. */
  members: Member[];
  allMembersLoaded: boolean;
  canManage: boolean;
  onRoleChange: (userId: string, role: Role) => Promise<void>;
  onRemove: (userId: string) => Promise<boolean>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  // null = "unknown, not all members loaded yet" — in that case we don't
  // pre-disable; the backend's own check remains the safety net for the
  // race. true/false only render once the full list is confirmed loaded.
  const isLastAdmin = isLastRemainingAdmin(members, allMembersLoaded, member.userId);
  const blockReason = getLastAdminBlockReason(members, allMembersLoaded, member.userId);

  async function handleConfirmRemove() {
    setRemoving(true);
    try {
      const success = await onRemove(member.userId);
      if (success) setConfirmOpen(false);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={member.user.name} size="lg" tone="subtle" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text truncate">{member.user.name}</p>
          <p className="text-xs text-text-subtle font-mono truncate">{member.user.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        {canManage ? (
          <RoleSelector
            value={member.role}
            onChange={(role) => onRoleChange(member.userId, role)}
            disabled={isLastAdmin === true}
            disabledReason={blockReason}
          />
        ) : (
          <RoleSelector value={member.role} onChange={() => {}} disabled />
        )}

        {canManage && (
          <Dropdown>
            <DropdownTrigger
              className="p-1.5 rounded-md text-text-subtle hover:text-text hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40"
              aria-label="More actions"
            >
              <MoreHorizontal size={16} />
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem
                disabled={isLastAdmin === true}
                title={isLastAdmin === true ? blockReason : undefined}
                onSelect={() => setConfirmOpen(true)}
                className={isLastAdmin === true ? "text-text-subtle" : "text-danger"}
              >
                Remove from organization
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>Remove {member.user.name}?</DialogTitle>
          <DialogDescription>
            They&apos;ll lose access to this organization immediately. This can&apos;t be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmRemove} disabled={removing}>
              {removing ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
