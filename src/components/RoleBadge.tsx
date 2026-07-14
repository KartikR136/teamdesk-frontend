import type { Role } from "@/types";

// The signature visual element of this UI: badge weight scales directly
// with permission rank, so the hierarchy that governs the whole product
// (VIEWER < MEMBER < MANAGER < ADMIN) is visible at a glance anywhere a
// role appears — org switcher, member list, activity feed.
const ROLE_STYLES: Record<Role, string> = {
  VIEWER: "bg-zinc-100 text-zinc-500",
  MEMBER: "bg-indigo-50 text-indigo-600",
  MANAGER: "bg-indigo-100 text-indigo-700",
  ADMIN: "bg-indigo-600 text-white",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide ${ROLE_STYLES[role]}`}
    >
      {role}
    </span>
  );
}
