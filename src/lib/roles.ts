import type { Role } from "@/types";
import type { BadgeProps } from "@/components/ui/Badge";

export interface RoleMeta {
  label: string;
  description: string;
  badgeVariant: NonNullable<BadgeProps["variant"]>;
}

// CONFIRMED from the backend rules stated in the project handoff:
// - VIEWER: read-only (create/edit requires MEMBER+)
// - MEMBER: can create projects, issues, and comments
// - ADMIN: invites/removes members, changes roles, and moderates any
//   comment (author-or-admin override), with the last-admin lockout
// MANAGER sits between MEMBER and ADMIN in rank (confirmed by the invite
// role options and RoleBadge's weight scale), but I haven't seen
// src/routes/members.ts to confirm what requireRole level actually gates
// the role-change/remove endpoints — the current UI only checks
// `isAdmin` client-side, which could be a frontend simplification rather
// than proof of the real backend rule. Not claiming Manager can change
// roles until that's confirmed.
export const ROLE_METADATA: Record<Role, RoleMeta> = {
  VIEWER: {
    label: "Viewer",
    description: "Can view projects, issues, and comments. Can't create or edit.",
    badgeVariant: "neutral",
  },
  MEMBER: {
    label: "Member",
    description: "Can create and edit projects, issues, and comments.",
    badgeVariant: "subtle",
  },
  MANAGER: {
    label: "Manager",
    description:
      "Has Member-level permissions with elevated standing in the organization.",
    badgeVariant: "subtle",
  },
  ADMIN: {
    label: "Admin",
    description:
      "Full control — manages members, roles, and invitations, and can moderate any comment.",
    badgeVariant: "solid",
  },
};

export const ROLE_ORDER: Role[] = ["VIEWER", "MEMBER", "MANAGER", "ADMIN"];
