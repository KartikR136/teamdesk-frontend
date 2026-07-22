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
// role options and RoleBadge's weight scale). Confirmed directly against
// every backend route file (members.ts, issues.ts, projects.ts,
// comments.ts, decisions.ts, invitations.ts, activity.ts): no route ever
// calls requireRole("MANAGER") — every actual permission check uses only
// VIEWER, MEMBER, or ADMIN as the threshold. MANAGER therefore has zero
// distinct backend permissions today; it behaves identically to MEMBER
// for every real authorization check. Its only current distinction is
// rank position when assigning a role. This was previously worded as
// unconfirmed — now confirmed by direct audit, not guessed.
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
