import type { Role } from "@/types";
import { cn } from "@/lib/utils";

// Signature visual element: badge weight scales with permission rank.
// Now uses role-specific semantic tokens from theme.css (--role-admin, etc.)
// so a retheme moves RoleBadge along with everything else.
const ROLE_STYLES: Record<Role, string> = {
  VIEWER:  "bg-[var(--role-viewer-bg)]  text-[var(--role-viewer)]",
  MEMBER:  "bg-[var(--role-member-bg)]  text-[var(--role-member)]",
  MANAGER: "bg-[var(--role-manager-bg)] text-[var(--role-manager)] font-semibold",
  ADMIN:   "bg-[var(--role-admin-bg)]   text-[var(--role-admin)]   font-semibold",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-pill text-xs tracking-wide transition-colors duration-fast",
        ROLE_STYLES[role],
      )}
    >
      {role}
    </span>
  );
}
