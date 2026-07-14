import type { Member, Role } from "@/types";

// These functions answer "should this control be disabled in the UI?" —
// they are a UX convenience layer, NOT the authorization boundary. The
// backend's requireRole middleware and isLastRemainingAdmin() check are
// the real enforcement; if these helpers and the backend ever disagree,
// the backend wins and the user sees its error message (see
// getLastAdminBlockReason below, which is deliberately conservative).

export function canManageMembers(viewerRole: Role | undefined): boolean {
  return viewerRole === "ADMIN";
}

export function countAdmins(members: Member[]): number {
  return members.filter((m) => m.role === "ADMIN").length;
}

/**
 * Whether removing/demoting this member would leave the org with zero
 * admins — but ONLY answerable when the full member list has actually
 * been loaded. Cursor pagination means "load more" can still be pending;
 * if not all members are loaded, this returns null (unknown) rather than
 * guessing, and the caller should defer to the backend's own 400 rather
 * than pre-disabling based on incomplete data.
 */
export function isLastRemainingAdmin(
  members: Member[],
  allMembersLoaded: boolean,
  targetUserId: string,
): boolean | null {
  if (!allMembersLoaded) return null;

  const target = members.find((m) => m.userId === targetUserId);
  if (!target || target.role !== "ADMIN") return false;

  return countAdmins(members) === 1;
}

/**
 * Human-readable reason to show next to a disabled control. Returns
 * undefined when the action is safe to attempt (including the "unknown,
 * not all members loaded yet" case — the backend remains the safety net
 * for that race).
 */
export function getLastAdminBlockReason(
  members: Member[],
  allMembersLoaded: boolean,
  targetUserId: string,
): string | undefined {
  const isLast = isLastRemainingAdmin(members, allMembersLoaded, targetUserId);
  if (isLast === true) {
    return "You can't remove or demote the last remaining admin.";
  }
  return undefined;
}
